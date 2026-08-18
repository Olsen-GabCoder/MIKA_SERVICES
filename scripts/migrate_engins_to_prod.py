# -*- coding: utf-8 -*-
"""
Migration des engins de la base locale MySQL vers la prod Render (via API).
- Crée chaque engin via POST /engins (code conservé, QR token généré par le backend)
- Applique statut / heuresCompteur via PUT /engins/{id}
- Upload la photo locale via POST /engins/{id}/photo (=> Cloudinary côté prod)
Idempotent : les codes déjà présents en prod sont ignorés (409).

Usage : python migrate_engins_to_prod.py
Prérequis : MYSQL_PWD exporté, PROD_ADMIN_EMAIL / PROD_ADMIN_PASSWORD exportés.
"""
import json
import os
import subprocess
import sys
import time

import requests

API = "https://mika-services-backend.onrender.com/api"
UPLOADS = os.path.join(os.path.dirname(__file__), "..", "backend", "uploads")

COLS = [
    "code", "nom", "type", "marque", "modele", "immatriculation", "numero_serie",
    "annee_fabrication", "date_acquisition", "date_mise_en_service", "valeur_acquisition",
    "proprietaire", "est_location", "cout_location_journalier", "etat", "mode_acquisition",
    "carburant", "puissance", "poids", "capacite", "caracteristiques", "notes",
    "statut", "heures_compteur", "photo",
]


def fetch_local_engins():
    sql = "SELECT " + ", ".join(f"IFNULL({c}, '')" for c in COLS) + " FROM engins ORDER BY id"
    out = subprocess.run(
        ["mysql", "--default-character-set=utf8mb4", "-u", "root", "mika_services_dev", "-N", "-B", "-e", sql],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=True,
    ).stdout
    rows = []
    for line in out.splitlines():
        vals = line.split("\t")
        if len(vals) != len(COLS):
            print(f"  ! ligne ignorée ({len(vals)} colonnes): {vals[:2]}")
            continue
        rows.append(dict(zip(COLS, [v if v != "" else None for v in vals])))
    return rows


def login():
    email = os.environ["PROD_ADMIN_EMAIL"]
    password = os.environ["PROD_ADMIN_PASSWORD"]
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=60)
    r.raise_for_status()
    d = r.json()
    token = d.get("accessToken") or d.get("data", {}).get("accessToken")
    if not token:
        sys.exit(f"Login KO: {d}")
    return {"Authorization": f"Bearer {token}"}


def to_create_payload(e):
    return {k: v for k, v in {
        "code": e["code"],
        "nom": e["nom"],
        "type": e["type"],
        "marque": e["marque"],
        "modele": e["modele"],
        "immatriculation": e["immatriculation"],
        "numeroSerie": e["numero_serie"],
        "anneeFabrication": int(e["annee_fabrication"]) if e["annee_fabrication"] else None,
        "dateAcquisition": e["date_acquisition"],
        "dateMiseEnService": e["date_mise_en_service"],
        "valeurAcquisition": float(e["valeur_acquisition"]) if e["valeur_acquisition"] else None,
        "proprietaire": e["proprietaire"],
        "estLocation": e["est_location"] in ("1", 1, True),
        "coutLocationJournalier": float(e["cout_location_journalier"]) if e["cout_location_journalier"] else None,
        "etat": e["etat"],
        "modeAcquisition": e["mode_acquisition"],
        "carburant": e["carburant"],
        "puissance": e["puissance"],
        "poids": e["poids"],
        "capacite": e["capacite"],
        "caracteristiques": e["caracteristiques"],
        "notes": e["notes"],
    }.items() if v is not None}


def fetch_prod_engins(headers):
    """Map code -> {id, photo} des engins déjà en prod."""
    existing = {}
    page = 0
    while True:
        r = requests.get(f"{API}/engins?size=200&page={page}", headers=headers, timeout=120)
        r.raise_for_status()
        d = r.json()
        for e in d["content"]:
            existing[e["code"]] = {"id": e["id"], "photo": e.get("photo")}
        if page >= d["page"]["totalPages"] - 1:
            break
        page += 1
    return existing


def main():
    engins = fetch_local_engins()
    print(f"{len(engins)} engins locaux à migrer")
    headers = login()
    print("Login prod OK")
    existing = fetch_prod_engins(headers)
    print(f"{len(existing)} engins déjà en prod")

    created = skipped = photos = errors = 0
    for i, e in enumerate(engins, 1):
        code = e["code"]
        try:
            if code in existing:
                engin_id = existing[code]["id"]
                has_photo = bool(existing[code]["photo"])
                skipped += 1
            else:
                r = requests.post(f"{API}/engins", json=to_create_payload(e), headers=headers, timeout=120)
                if r.status_code == 401:  # token expiré → re-login et retry
                    headers.update(login())
                    r = requests.post(f"{API}/engins", json=to_create_payload(e), headers=headers, timeout=120)
                if r.status_code != 201:
                    print(f"[{i}/{len(engins)}] {code} ERREUR create {r.status_code}: {r.text[:200]}")
                    errors += 1
                    continue
                engin_id = r.json()["id"]
                has_photo = False
                created += 1

                # Statut + compteur (non gérés par le create)
                update = {}
                if e["statut"] and e["statut"] != "DISPONIBLE":
                    update["statut"] = e["statut"]
                if e["heures_compteur"] and int(e["heures_compteur"]) > 0:
                    update["heuresCompteur"] = int(e["heures_compteur"])
                if update:
                    ru = requests.put(f"{API}/engins/{engin_id}", json=update, headers=headers, timeout=120)
                    if ru.status_code != 200:
                        print(f"    ! update {code}: {ru.status_code} {ru.text[:150]}")

            # Photo -> Cloudinary (uniquement si absente en prod)
            if e["photo"] and not has_photo:
                photo_path = os.path.normpath(os.path.join(UPLOADS, e["photo"]))
                if os.path.isfile(photo_path):
                    with open(photo_path, "rb") as f:
                        rp = requests.post(
                            f"{API}/engins/{engin_id}/photo",
                            files={"file": (os.path.basename(photo_path), f, "image/jpeg")},
                            headers=headers, timeout=180,
                        )
                    if rp.status_code == 401:
                        headers.update(login())
                        with open(photo_path, "rb") as f:
                            rp = requests.post(
                                f"{API}/engins/{engin_id}/photo",
                                files={"file": (os.path.basename(photo_path), f, "image/jpeg")},
                                headers=headers, timeout=180,
                            )
                    if rp.status_code != 200:
                        print(f"    ! photo {code}: {rp.status_code} {rp.text[:150]}")
                        errors += 1
                    else:
                        photos += 1
                else:
                    print(f"    ! photo introuvable: {photo_path}")

            print(f"[{i}/{len(engins)}] {code} OK (id prod {engin_id})")
        except Exception as ex:
            errors += 1
            print(f"[{i}/{len(engins)}] {code} EXCEPTION: {ex}")
            time.sleep(2)

    print(f"\nTerminé : {created} créés, {skipped} déjà présents, {photos} photos uploadées, {errors} erreurs")


if __name__ == "__main__":
    main()
