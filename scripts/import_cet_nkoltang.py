"""
Import DQE CET NKOLTANG (Projet ID=18) — 12 chapitres.
Total HT cible : 4 569 374 509 FCFA
"""
import requests, openpyxl, sys, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

API = "https://mika-services-backend.onrender.com/api"
EMAIL = "olsenkampala@gmail.com"
PASSWORD = "Olsenk2000#2000"
PROJET_ID = 18

def login():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=60)
    r.raise_for_status()
    return r.json()["accessToken"]

def hdr(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def create_chapitre(token, numero, designation, ordre):
    data = {"projetId": PROJET_ID, "numero": numero, "designation": designation, "ordre": ordre}
    r = requests.post(f"{API}/dqe/chapitres", json=data, headers=hdr(token), timeout=30)
    r.raise_for_status()
    return r.json()["id"]

def create_ligne(token, chapitre_id, numero_poste, designation, unite, quantite, pu, montant, ordre):
    data = {
        "chapitreId": chapitre_id,
        "numeroPoste": str(numero_poste) if numero_poste else None,
        "designation": designation,
        "unite": unite,
        "quantite": round(quantite, 4) if quantite else 0,
        "prixUnitaire": round(pu, 2) if pu else 0,
        "montantTotal": round(montant, 2) if montant else 0,
        "avancementPct": 0,
        "ordre": ordre,
    }
    r = requests.post(f"{API}/dqe/lignes", json=data, headers=hdr(token), timeout=30)
    r.raise_for_status()
    return r.json()["id"]

def parse_excel():
    wb = openpyxl.load_workbook("docs/DQE_CET Nkoltang_révRJ 05122025.xlsm", data_only=True)
    ws = wb["DQE CET"]

    # Structure: chapter headers have N° like 100, 200... and no montant
    # Lines have N° like 101, 102... with montant
    # Sous-totaux start with "Sous-total" in col B
    chapters = []
    current = None

    for r in range(25, 115):
        a = str(ws.cell(r, 1).value).strip() if ws.cell(r, 1).value else ""
        b = str(ws.cell(r, 2).value).strip() if ws.cell(r, 2).value else ""
        c = ws.cell(r, 3).value  # Quantité
        d = str(ws.cell(r, 4).value).strip() if ws.cell(r, 4).value else ""  # Unité
        e = ws.cell(r, 5).value  # PU
        f = ws.cell(r, 6).value  # Montant total

        # Skip sous-totaux, totaux, vides
        bl = b.upper()
        if bl.startswith(("SOUS-TOTAL", "MONTANT TOTAL", "TVA", "CSS", "ARRÊTÉ")):
            continue
        if not a and not b:
            continue

        # Detect chapter header: N° is round hundred (100, 200...) and no montant
        is_chapter = False
        if a and a.isdigit() and int(a) % 100 == 0 and f is None:
            is_chapter = True

        if is_chapter:
            if current:
                chapters.append(current)
            current = {"numero": a, "designation": b[:200], "lignes": []}
            continue

        if current is None:
            continue

        # Data line
        mt = float(f) if isinstance(f, (int, float)) else 0
        quantite = float(c) if isinstance(c, (int, float)) else 0
        pu_val = float(e) if isinstance(e, (int, float)) else 0

        # R84 has no N° but is a real line (abri engins)
        num = a if a else f"L{r}"

        if b:  # has designation
            current["lignes"].append({
                "num": num,
                "designation": b[:200],
                "unite": d,
                "quantite": quantite,
                "pu": pu_val,
                "montant": mt,
            })

    if current:
        chapters.append(current)

    return chapters


def main():
    print("=" * 60)
    print("IMPORT DQE CET NKOLTANG — Projet ID=18")
    print("=" * 60)

    # 1) Parse
    print("\n1) Parsing Excel...")
    chapters = parse_excel()
    total_lignes = sum(len(ch["lignes"]) for ch in chapters)
    total_montant = sum(l["montant"] for ch in chapters for l in ch["lignes"])

    for ch in chapters:
        t = sum(l["montant"] for l in ch["lignes"])
        print(f"   Ch {ch['numero']:>5s}: {ch['designation'][:50]:50s} | {len(ch['lignes']):2d} lignes | {t:>18,.0f}")

    cible = 4_569_374_509
    print(f"\n   TOTAL calculé : {total_montant:,.0f}")
    print(f"   TOTAL cible   : {cible:,.0f}")
    print(f"   Écart         : {total_montant - cible:,.0f}")

    # 2) Login
    print("\n2) Connexion API prod...")
    token = login()
    print("   Connecté!")

    # 3) Vérifier qu'il n'y a rien
    r = requests.get(f"{API}/dqe/projet/{PROJET_ID}", headers=hdr(token), timeout=30)
    existing = r.json() if r.status_code == 200 else []
    if isinstance(existing, list) and len(existing) > 0:
        print(f"   ⚠️  {len(existing)} chapitre(s) existant(s) — suppression...")
        for ch in existing:
            requests.delete(f"{API}/dqe/chapitres/{ch['id']}", headers=hdr(token), timeout=30)
        print("   Supprimé.")

    # 4) Import
    print("\n3) Import des chapitres et lignes...")
    created = 0
    montant_cree = 0

    for ordre, ch in enumerate(chapters, 1):
        ch_id = create_chapitre(token, ch["numero"], ch["designation"], ordre)
        t = sum(l["montant"] for l in ch["lignes"])
        print(f"\n   Chapitre {ch['numero']} '{ch['designation'][:40]}' créé (id={ch_id})")

        for i, l in enumerate(ch["lignes"], 1):
            try:
                create_ligne(token, ch_id, l["num"], l["designation"], l["unite"],
                             l["quantite"], l["pu"], l["montant"], i)
                created += 1
                montant_cree += l["montant"]
            except Exception as e:
                print(f"   [ERR] {l['num']} '{l['designation'][:40]}': {e}")

        print(f"   -> {len(ch['lignes'])} lignes, sous-total: {t:,.0f}")

    # 5) Vérification
    print("\n" + "=" * 60)
    print("4) VÉRIFICATION FINALE")
    token = login()
    r = requests.get(f"{API}/dqe/projet/{PROJET_ID}/summary", headers=hdr(token), timeout=30)
    if r.status_code == 200:
        s = r.json()
        print(f"   Chapitres  : {s.get('nombreChapitres')}")
        print(f"   Lignes     : {s.get('nombreLignes')}")
        print(f"   Montant DQE: {s.get('montantTotalDqe'):,.0f} FCFA")
        print(f"   Cible      : {cible:,.0f} FCFA")
        ecart = s.get("montantTotalDqe", 0) - cible
        if abs(ecart) < 10:
            print("   ✅ IMPORT RÉUSSI — montant conforme!")
        else:
            print(f"   ⚠️  Écart résiduel: {ecart:,.0f} FCFA")

    print(f"\n   Lignes créées: {created}")
    print(f"   Montant total: {montant_cree:,.0f} FCFA")
    print("=" * 60)


if __name__ == "__main__":
    main()
