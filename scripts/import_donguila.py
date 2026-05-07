"""
Import DQE CAPA DONGUILA (Projet ID=4) — 4 lots.
Total HT cible : 819 880 982 FCFA
"""
import requests, openpyxl, sys, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

API = "https://mika-services-backend.onrender.com/api"
EMAIL = "olsenkampala@gmail.com"
PASSWORD = "Olsenk2000#2000"
PROJET_ID = 4

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
        "designation": designation[:250],
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


def extract_sheet(wb, sheet_name, header_row=12):
    """Extract chapitres and lignes from a DQE sheet."""
    ws = wb[sheet_name]
    chapters = []
    current = None

    for r in range(header_row, ws.max_row + 1):
        a = str(ws.cell(r, 1).value).strip() if ws.cell(r, 1).value else ""
        b = str(ws.cell(r, 2).value).strip() if ws.cell(r, 2).value else ""
        c = str(ws.cell(r, 3).value).strip() if ws.cell(r, 3).value else ""
        d = ws.cell(r, 4).value  # Quantité
        e = ws.cell(r, 5).value  # PU
        f = ws.cell(r, 6).value  # Montant

        # Skip headers, totaux, sous-totaux, vides
        if a in ("N°",):
            continue
        bl = b.upper()
        if bl.startswith(("SOUS TOTAL", "SOUS-TOTAL", "MONTANT TOTAL", "TVA", "CCS", "CSS", "ARRÊTÉ")):
            continue
        if not a and not b:
            continue

        mt = float(f) if isinstance(f, (int, float)) else 0
        quantite = float(d) if isinstance(d, (int, float)) else 0
        pu_val = float(e) if isinstance(e, (int, float)) else 0

        # Detect chapter header: N° is round hundred (000, 100, 200...) and designation in UPPER and no montant
        is_chapter = False
        if a and a.isdigit():
            num = int(a)
            if num % 100 == 0 and f is None and b:
                is_chapter = True

        if is_chapter:
            if current:
                chapters.append(current)
            current = {"numero": a, "designation": b, "lignes": []}
            continue

        if current is None:
            continue

        # Skip sub-headers (no montant, no unite, just section titles)
        if mt == 0 and not c and pu_val == 0:
            continue

        # Skip lines with PM as quantity
        if isinstance(d, str) and d.upper() == "PM":
            quantite = 0

        if b:
            current["lignes"].append({
                "num": a if a else f"L{r}",
                "designation": b[:200],
                "unite": c,
                "quantite": quantite,
                "pu": pu_val,
                "montant": mt,
            })

    if current:
        chapters.append(current)

    return chapters


def parse_all():
    wb = openpyxl.load_workbook("docs/Suivi Projet CAPA DONGUILA.xlsm", data_only=True)

    # 4 lots, each becomes a top-level chapitre
    lots = [
        ("LOT1", "BATIMENT CENTRE DE PECHE", "Bâtiment Centre de Pêche", 12),
        ("LOT2", "RESTAURANT BAR", "Restaurant Bar", 12),
        ("LOT3", "VESTIAIRES", "Vestiaires", 12),
        ("LOT4", "CONSTRUCTION ROUTE", "Construction Route / Parking / Ponton", 11),
    ]

    all_chapters = []
    for lot_num, sheet, lot_name, hdr_row in lots:
        sub_chapters = extract_sheet(wb, sheet, hdr_row)
        # Merge sub-chapters with same numero, skip empty ones
        merged = {}
        for sc in sub_chapters:
            key = sc["numero"]
            if key in merged:
                # Merge lignes, append designation if different
                merged[key]["lignes"].extend(sc["lignes"])
                if sc["designation"] not in merged[key]["designation"]:
                    merged[key]["designation"] += " / " + sc["designation"]
            else:
                merged[key] = {"numero": key, "designation": sc["designation"], "lignes": list(sc["lignes"])}

        for sc in merged.values():
            if not sc["lignes"]:
                continue  # Skip empty chapters
            ch_numero = f"{lot_num}-{sc['numero']}"
            ch_designation = f"{lot_name} — {sc['designation']}"
            all_chapters.append({
                "numero": ch_numero,
                "designation": ch_designation[:200],
                "lignes": sc["lignes"],
            })

    return all_chapters


def main():
    print("=" * 60)
    print("IMPORT DQE CAPA DONGUILA — Projet ID=4")
    print("=" * 60)

    # 1) Parse
    print("\n1) Parsing Excel...")
    chapters = parse_all()
    total_lignes = sum(len(ch["lignes"]) for ch in chapters)
    total_montant = sum(l["montant"] for ch in chapters for l in ch["lignes"])

    for ch in chapters:
        t = sum(l["montant"] for l in ch["lignes"])
        print(f"   {ch['numero']:>10s}: {ch['designation'][:55]:55s} | {len(ch['lignes']):2d} lignes | {t:>15,.0f}")

    cible = 819_880_982
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
        print(f"\n   {ch['numero']} '{ch['designation'][:45]}' (id={ch_id})")

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
