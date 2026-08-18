#!/usr/bin/env python
"""Build stats_qui_fait_quoi.json from production data."""
import json, collections, glob, os

TEMP = "C:/Users/asus/AppData/Local/Temp"
OUT = "C:/Projet_Mika_Services/stats_qui_fait_quoi.json"

ADMIN_IDS = {1, 3, 18, 19, 24, 21, 26, 27, 32}

# Load data
with open(f"{TEMP}/mika_projets_detail.json", "r", encoding="utf-8") as f:
    projets = json.load(f)

with open(f"{TEMP}/mika_projets_children.json", "r", encoding="utf-8") as f:
    children = json.load(f)

with open(f"{TEMP}/mika_users.json", "r", encoding="utf-8") as f:
    users_raw = json.load(f)
    users_list = users_raw.get("content", users_raw) if isinstance(users_raw, dict) else users_raw

audit_entries = []
for fp in sorted(glob.glob(f"{TEMP}/mika_audit_p*.json")):
    with open(fp, "r", encoding="utf-8") as f:
        data = json.load(f)
        audit_entries.extend(data.get("content", []))

# User map
user_map = {}
for u in users_list:
    uid = u["id"]
    user_map[uid] = {
        "id": uid,
        "nom": f"{u.get('prenom','').strip()} {u.get('nom','').strip()}".strip(),
        "email": u.get("email", ""),
        "roles_systeme": [r["code"] for r in u.get("roles", [])],
        "role_rapport": "ADMIN_EXCLU" if uid in ADMIN_IDS else "OPERATIONNEL",
        "lastLogin": u.get("lastLogin"),
    }

# User 17 appears in audit but not in API /users — add manually from audit data
if 17 not in user_map:
    user_map[17] = {
        "id": 17, "nom": "Ulrich Landry IBOUANA", "email": "ulrich.ibouana@mikaservices-ga.com",
        "roles_systeme": ["CHEF_PROJET"], "role_rapport": "OPERATIONNEL", "lastLogin": None,
    }

operationnels = {uid: info for uid, info in user_map.items() if info["role_rapport"] == "OPERATIONNEL"}

# ============ BLOC 1: CONTRIBUTIONS ============
user_contributions = {}
for e in audit_entries:
    uid = e.get("userId")
    if uid is None or uid in ADMIN_IDS:
        continue

    if uid not in user_contributions:
        user_contributions[uid] = {
            "logins": 0, "page_views": 0, "modifications_projet": 0,
            "consultations_projet": 0, "pages_autres": 0,
            "first_activity": None, "last_activity": None,
            "pages_visited": collections.Counter(),
        }

    uc = user_contributions[uid]
    dt = e.get("createdAt", "")
    if uc["first_activity"] is None or dt < uc["first_activity"]:
        uc["first_activity"] = dt
    if uc["last_activity"] is None or dt > uc["last_activity"]:
        uc["last_activity"] = dt

    action = e.get("action", "")
    details = e.get("details", "") or ""

    if action == "LOGIN":
        uc["logins"] += 1
    elif action == "PAGE_VIEW":
        uc["page_views"] += 1
        uc["pages_visited"][details] += 1
        if "Modification projet" in details or "modification" in details.lower():
            uc["modifications_projet"] += 1
        elif "tail projet" in details or "Projets" == details:
            uc["consultations_projet"] += 1
        else:
            uc["pages_autres"] += 1

contributions = []
for uid in sorted(user_contributions, key=lambda u: -(user_contributions[u]["page_views"] + user_contributions[u]["logins"])):
    uc = user_contributions[uid]
    info = user_map.get(uid, {"nom": f"User {uid}", "roles_systeme": []})
    contributions.append({
        "userId": uid,
        "nom": info["nom"],
        "roles_systeme": info.get("roles_systeme", []),
        "logins": uc["logins"],
        "page_views_total": uc["page_views"],
        "consultations_projet": uc["consultations_projet"],
        "modifications_projet_pages": uc["modifications_projet"],
        "pages_autres_modules": uc["pages_autres"],
        "premiere_activite": uc["first_activity"][:10] if uc["first_activity"] else None,
        "derniere_activite": uc["last_activity"][:10] if uc["last_activity"] else None,
        "top_pages": dict(uc["pages_visited"].most_common(10)),
    })

# ============ BLOC 2: PROJETS ============
projets_output = []
statut_count = collections.Counter()
type_count = collections.Counter()
province_count = collections.Counter()
montant_total = 0
avanc_phys_list = []

for p in projets:
    pid = p["id"]
    ch = children.get(str(pid), {})

    taches = ch.get("taches", [])
    prevs = ch.get("previsions", [])
    avanc = ch.get("avancements", [])
    pbs = ch.get("points_bloquants", [])
    dqe = ch.get("dqe", [])
    suivi = ch.get("suivi_mensuel", [])

    nb_dqe_lignes = sum(len(c.get("lignes", [])) for c in dqe) if isinstance(dqe, list) else 0
    nb_dqe_chap = len(dqe) if isinstance(dqe, list) else 0

    taches_par_statut = collections.Counter(t.get("statut") for t in taches)
    taches_sans_assignation = sum(1 for t in taches if not t.get("assigneA"))
    taches_sans_echeance = sum(1 for t in taches if not t.get("dateEcheance"))
    taches_en_retard = sum(1 for t in taches if t.get("enRetard"))

    prev_semaines = collections.Counter(
        f"{pv.get('annee','?')}-S{str(pv.get('semaine','?')).zfill(2)}" for pv in prevs
    )

    suivi_mois = []
    if isinstance(suivi, list):
        for s in suivi:
            suivi_mois.append({
                "mois": s.get("mois"),
                "caReel": s.get("caReel"),
                "caPrevisionnel": s.get("caPrevisionnel"),
                "avancementPhysique": s.get("avancementPhysique"),
            })

    statut = p.get("statut", "?")
    ptype = p.get("type", "?")
    province = p.get("province") or "Non renseigne"
    montant = p.get("montantHT")
    avanc_phys = p.get("avancementPhysiquePct")

    statut_count[statut] += 1
    type_count[ptype] += 1
    province_count[province] += 1
    if montant:
        montant_total += montant
    if avanc_phys is not None:
        avanc_phys_list.append(avanc_phys)

    resp = p.get("responsableProjet")
    resp_nom = None
    if resp and isinstance(resp, dict):
        resp_nom = f"{resp.get('prenom','')} {resp.get('nom','')}".strip()

    client = p.get("client")
    client_nom = None
    if client and isinstance(client, dict):
        client_nom = client.get("nom")

    score = len(taches) + len(prevs) + (len(suivi) if isinstance(suivi, list) else 0) * 2 + nb_dqe_lignes // 10 + (len(pbs) if isinstance(pbs, list) else 0)

    projets_output.append({
        "id": pid,
        "nom": p.get("nom", ""),
        "codeProjet": p.get("codeProjet", ""),
        "statut": statut,
        "type": ptype,
        "province": province,
        "ville": p.get("ville"),
        "montantHT": montant,
        "dateDebut": p.get("dateDebut"),
        "dateFin": p.get("dateFin"),
        "delaiMois": p.get("delaiMois"),
        "avancementGlobal": p.get("avancementGlobal"),
        "avancementPhysiquePct": avanc_phys,
        "avancementFinancierPct": p.get("avancementFinancierPct"),
        "delaiConsommePct": p.get("delaiConsommePct"),
        "description": p.get("description"),
        "responsable": resp_nom,
        "client": client_nom,
        "sourceFinancement": p.get("sourceFinancement"),
        "createdAt": p.get("createdAt"),
        "updatedAt": p.get("updatedAt"),
        "chantierActif": p.get("chantierActif"),
        "motifArretChantier": p.get("motifArretChantier"),
        "score_activite": score,
        "nb_taches": len(taches),
        "taches_par_statut": dict(taches_par_statut),
        "taches_sans_assignation": taches_sans_assignation,
        "taches_sans_echeance": taches_sans_echeance,
        "taches_en_retard": taches_en_retard,
        "nb_previsions": len(prevs),
        "previsions_par_semaine": dict(prev_semaines) if prev_semaines else {},
        "nb_avancements_etude": len(avanc) if isinstance(avanc, list) else 0,
        "nb_points_bloquants": len(pbs) if isinstance(pbs, list) else 0,
        "points_bloquants_ouverts": sum(1 for pb in (pbs if isinstance(pbs, list) else []) if pb.get("statut") == "OUVERT"),
        "dqe_present": nb_dqe_lignes > 0,
        "dqe_chapitres": nb_dqe_chap,
        "dqe_lignes": nb_dqe_lignes,
        "nb_suivi_mensuel": len(suivi) if isinstance(suivi, list) else 0,
        "suivi_mensuel_resume": suivi_mois,
    })

projets_output.sort(key=lambda x: -x["score_activite"])

# ============ BLOC 3: TACHES ============
all_taches = []
for pid_str, ch in children.items():
    for t in ch.get("taches", []):
        t["_projetId"] = int(pid_str)
        all_taches.append(t)

taches_statut = collections.Counter(t.get("statut") for t in all_taches)
taches_par_projet = collections.Counter(t["_projetId"] for t in all_taches)
taches_assignees = [t for t in all_taches if t.get("assigneA")]
taches_avec_echeance = [t for t in all_taches if t.get("dateEcheance")]
taches_en_retard_all = [t for t in all_taches if t.get("enRetard")]

assignation_count = collections.Counter()
for t in all_taches:
    a = t.get("assigneA")
    if a:
        assignation_count[a] += 1

# ============ BLOC 4: AVANCEMENTS ============
all_previsions = []
all_suivi = []
all_pbs = []
for pid_str, ch in children.items():
    for pv in ch.get("previsions", []):
        pv["_projetId"] = int(pid_str)
        all_previsions.append(pv)
    sm = ch.get("suivi_mensuel", [])
    if isinstance(sm, list):
        for s in sm:
            s["_projetId"] = int(pid_str)
            all_suivi.append(s)
    pbl = ch.get("points_bloquants", [])
    if isinstance(pbl, list):
        for pb in pbl:
            pb["_projetId"] = int(pid_str)
            all_pbs.append(pb)

pb_statut = collections.Counter(pb.get("statut") for pb in all_pbs)
suivi_par_projet = collections.Counter(s["_projetId"] for s in all_suivi)
prev_semaines_global = collections.Counter(
    f"{pv.get('annee','?')}-S{str(pv.get('semaine','?')).zfill(2)}" for pv in all_previsions
)

# ============ BLOC 5: FICHES OPERATIONNELS ============
fiches = []
for uid, info in sorted(operationnels.items(), key=lambda x: x[1]["nom"]):
    uc = user_contributions.get(uid, {})
    nom = info["nom"]
    taches_user = [t for t in all_taches if t.get("assigneA") == nom]

    fiche = {
        "userId": uid,
        "nom": nom,
        "roles_systeme": info["roles_systeme"],
        "lastLogin": info["lastLogin"][:10] if info.get("lastLogin") else None,
        "logins": uc.get("logins", 0),
        "page_views": uc.get("page_views", 0),
        "modifications_projet_pages": uc.get("modifications_projet", 0),
        "premiere_activite": uc.get("first_activity", "")[:10] if uc.get("first_activity") else None,
        "derniere_activite": uc.get("last_activity", "")[:10] if uc.get("last_activity") else None,
        "nb_taches_assignees": len(taches_user),
        "responsable_projets": [],
        "_note_created_by": "created_by NULL partout — nb_projets_crees et nb_avancements_saisis non mesurables",
    }

    for p in projets_output:
        if p.get("responsable") and nom.lower() in p["responsable"].lower():
            fiche["responsable_projets"].append({"id": p["id"], "nom": p["nom"]})

    fiches.append(fiche)

# ============ AGGREGATS ============
avanc_phys_moyen = round(sum(avanc_phys_list) / len(avanc_phys_list), 1) if avanc_phys_list else None

# Project names map for taches_par_projet
projet_nom_map = {p["id"]: p["nom"] for p in projets_output}
taches_par_projet_named = {
    f"{pid} - {projet_nom_map.get(pid, '?')[:40]}": cnt
    for pid, cnt in taches_par_projet.most_common()
}

final = {
    "_metadata": {
        "source": "Production Render (PostgreSQL)",
        "date_extraction": "2026-06-25",
        "periode_audit": "2026-03-16 / 2026-06-25",
        "nb_audit_events": len(audit_entries),
        "nb_utilisateurs_total": len(user_map),
        "nb_operationnels": len(operationnels),
        "admins_exclus": [user_map[uid]["nom"] for uid in sorted(ADMIN_IDS) if uid in user_map],
        "note_created_by": "Les colonnes created_by/updated_by existent en base mais sont NULL sur toutes les tables metier (sauf users). Les contributions sont mesurees via les audit_logs et les champs assigneA.",
    },

    "bloc1_contributions_operationnels": contributions,

    "bloc2_projets": {
        "total": len(projets),
        "agregats": {
            "par_statut": dict(statut_count.most_common()),
            "par_type": dict(type_count.most_common()),
            "par_province": dict(province_count.most_common()),
            "montant_ht_total_portefeuille": montant_total,
            "avancement_physique_moyen_pct": avanc_phys_moyen,
            "projets_avec_taches": sum(1 for p in projets_output if p["nb_taches"] > 0),
            "projets_sans_aucune_tache": sum(1 for p in projets_output if p["nb_taches"] == 0),
            "projets_avec_dqe": sum(1 for p in projets_output if p["dqe_present"]),
            "projets_avec_suivi_mensuel": sum(1 for p in projets_output if p["nb_suivi_mensuel"] > 0),
            "projets_avec_responsable": sum(1 for p in projets_output if p["responsable"]),
            "projets_avec_client": sum(1 for p in projets_output if p["client"]),
            "projets_avec_description": sum(1 for p in projets_output if p["description"]),
        },
        "liste_par_activite": projets_output,
    },

    "bloc3_taches": {
        "total": len(all_taches),
        "par_statut": dict(taches_statut.most_common()),
        "par_projet": taches_par_projet_named,
        "taux_sans_assignation_pct": round((len(all_taches) - len(taches_assignees)) * 100 / len(all_taches), 1) if all_taches else 0,
        "taux_sans_echeance_pct": round((len(all_taches) - len(taches_avec_echeance)) * 100 / len(all_taches), 1) if all_taches else 0,
        "nb_en_retard": len(taches_en_retard_all),
        "assignation_par_personne": dict(assignation_count.most_common()),
    },

    "bloc4_avancements_suivi": {
        "previsions_hebdo": {
            "total": len(all_previsions),
            "par_semaine": dict(sorted(prev_semaines_global.items())),
            "_note": "created_by NULL — auteur des previsions non identifiable",
        },
        "suivi_mensuel": {
            "total": len(all_suivi),
            "par_projet": {
                f"{pid} - {projet_nom_map.get(pid, '?')[:40]}": cnt
                for pid, cnt in suivi_par_projet.most_common()
            },
        },
        "points_bloquants": {
            "total": len(all_pbs),
            "par_statut": dict(pb_statut.most_common()),
            "par_projet": {
                f"{pid} - {projet_nom_map.get(pid, '?')[:40]}": cnt
                for pid, cnt in collections.Counter(pb["_projetId"] for pb in all_pbs).most_common()
            },
            "_note": "detectePar et assigneA NULL sur tous les PB",
        },
    },

    "bloc5_fiches_operationnels": fiches,
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(final, f, ensure_ascii=False, indent=2, default=str)

print(f"JSON saved: {OUT}")
print(f"Size: {os.path.getsize(OUT)} bytes")
print(f"\n=== RESUME ===")
print(f"Operationnels: {len(operationnels)}")
print(f"Projets: {len(projets)} (actifs avec taches: {sum(1 for p in projets_output if p['nb_taches']>0)})")
print(f"Taches: {len(all_taches)} (en retard: {len(taches_en_retard_all)})")
print(f"Previsions hebdo: {len(all_previsions)}")
print(f"Suivi mensuel: {len(all_suivi)}")
print(f"Points bloquants: {len(all_pbs)}")
print(f"DQE: {sum(1 for p in projets_output if p['dqe_present'])} projets avec DQE")
print(f"Montant total portefeuille: {montant_total:,.0f} FCFA")
print(f"Avancement physique moyen: {avanc_phys_moyen}%")
