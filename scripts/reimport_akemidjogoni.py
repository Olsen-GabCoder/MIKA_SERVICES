"""
Réimport DQE AKEMIDJOGONI (Projet ID=24) avec structure correcte.
- Supprime le chapitre unique existant (id=5, 341 lignes)
- Recrée 7 chapitres propres depuis le fichier Excel
- Total HT cible : 3 888 836 403 FCFA
"""
import requests, openpyxl, sys, os, time

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

API = "https://mika-services-backend.onrender.com/api"
EMAIL = "olsenkampala@gmail.com"
PASSWORD = "Olsenk2000#2000"
PROJET_ID = 24

# ── Auth ──────────────────────────────────────────────────────────
def login():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=60)
    r.raise_for_status()
    return r.json()["accessToken"]

def hdr(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ── API helpers ───────────────────────────────────────────────────
def delete_chapitre(token, chap_id):
    r = requests.delete(f"{API}/dqe/chapitres/{chap_id}", headers=hdr(token), timeout=30)
    return r.status_code

def create_chapitre(token, projet_id, numero, designation, ordre):
    data = {"projetId": projet_id, "numero": numero, "designation": designation, "ordre": ordre}
    r = requests.post(f"{API}/dqe/chapitres", json=data, headers=hdr(token), timeout=30)
    r.raise_for_status()
    return r.json()["id"]

def create_ligne(token, chapitre_id, numero_poste, designation, unite, quantite, prix_unitaire, montant_total, ordre):
    data = {
        "chapitreId": chapitre_id,
        "numeroPoste": str(numero_poste) if numero_poste else None,
        "designation": designation,
        "unite": unite,
        "quantite": round(quantite, 4) if quantite else 0,
        "prixUnitaire": round(prix_unitaire, 2) if prix_unitaire else 0,
        "montantTotal": round(montant_total, 2) if montant_total else 0,
        "avancementPct": 0,
        "ordre": ordre,
    }
    r = requests.post(f"{API}/dqe/lignes", json=data, headers=hdr(token), timeout=30)
    r.raise_for_status()
    return r.json()["id"]

# ── Excel parsing ─────────────────────────────────────────────────
def parse_excel():
    wb = openpyxl.load_workbook("docs/DQE FINALISé PROJET AKEMIDJOGONI.xlsx", data_only=True)
    ws = wb["Nouveau DQE"]

    def cell(r, c):
        return ws.cell(r, c).value

    def sval(r, c):
        v = cell(r, c)
        return str(v).strip() if v else ""

    def nval(r, c):
        v = cell(r, c)
        return float(v) if isinstance(v, (int, float)) else 0

    def is_pm(r):
        v = cell(r, 7)
        return isinstance(v, str) and "mémoire" in v.lower()

    # ── Helper: extract lines with N° poste and numeric montant ──
    def extract_lines(start_row, end_row, skip_summaries=None):
        """Extract main lines (with N° poste) from row range."""
        skip = set(skip_summaries or [])
        lines = []
        for r in range(start_row, end_row + 1):
            num = sval(r, 1)
            des = sval(r, 2)
            if not num or num in ("N° Prix", "N°"):
                continue
            if not des:
                continue
            bl = des.upper()
            if bl.startswith(("TOTAL", "SOUS-TOTAL", "L TOTAL", "TVA", "CSS", "ARRÊT", "OWENDO")):
                continue
            if num in skip:
                continue

            mt = cell(r, 7)
            has_mt = isinstance(mt, (int, float)) and mt != 0
            pm = is_pm(r)

            if has_mt or pm:
                lines.append({
                    "num": num,
                    "designation": des[:200],
                    "unite": sval(r, 3),
                    "quantite": nval(r, 5),
                    "pu": nval(r, 6),
                    "montant": float(mt) if has_mt else 0,
                })
        return lines

    chapters = []

    # ── Chapitre 100: Travaux Préparatoires (R17-R191) ──
    ch100 = extract_lines(17, 191)
    chapters.append(("100", "Travaux Préparatoires", ch100))

    # ── Chapitre 200: Terrassements (R194-R231) — PM ──
    ch200 = extract_lines(194, 231)
    chapters.append(("200", "Terrassements", ch200))

    # ── Chapitre 300: Chaussées - Trottoirs (R233-R281) — PM ──
    ch300 = extract_lines(233, 281)
    chapters.append(("300", "Chaussées - Trottoirs", ch300))

    # ── Chapitre 3000: Construction de Route (R283-R316) ──
    ch3000 = extract_lines(283, 316)
    chapters.append(("3000", "Construction de Route", ch3000))

    # ── Chapitre 400: Assainissement et Drainage (R318-R343) — PM ──
    ch400 = extract_lines(318, 343)
    chapters.append(("400", "Assainissement et Drainage", ch400))

    # ── Chapitre 500: Bassins Versants (R345-R555) ──
    ch500 = extract_lines(345, 555)
    chapters.append(("500", "Bassins Versants et Assainissements Divers", ch500))

    # ── Chapitre 600: Indemnisations et Aménagements (R561-R620) ──
    # Skip summary items A and C (their details are already included)
    ch600 = extract_lines(561, 620, skip_summaries={"A", "C"})
    chapters.append(("600", "Indemnisations et Aménagements Spécifiques", ch600))

    return chapters


# ── Main ──────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("RÉIMPORT DQE AKEMIDJOGONI — Projet ID=24")
    print("=" * 60)

    # 1) Parse Excel
    print("\n1) Parsing Excel...")
    chapters = parse_excel()
    total_lignes = sum(len(ch[2]) for ch in chapters)
    total_montant = sum(l["montant"] for ch in chapters for l in ch[2])
    print(f"   {len(chapters)} chapitres, {total_lignes} lignes, montant={total_montant:,.0f} FCFA")
    for num, des, lines in chapters:
        t = sum(l["montant"] for l in lines)
        chiffrees = sum(1 for l in lines if l["montant"] > 0)
        pm = sum(1 for l in lines if l["montant"] == 0)
        print(f"   Ch {num:>5s}: {des[:45]:45s} | {len(lines):3d} lignes ({chiffrees} chiffrées, {pm} PM) | {t:>15,.0f}")

    cible = 3_888_836_403
    ecart = total_montant - cible
    print(f"\n   TOTAL calculé : {total_montant:,.0f}")
    print(f"   TOTAL cible   : {cible:,.0f}")
    print(f"   Écart         : {ecart:,.0f}")

    # 2) Login
    print("\n2) Connexion API prod...")
    token = login()
    print("   Connecté!")

    # 3) Supprimer l'existant
    print("\n3) Suppression du chapitre existant (id=5)...")
    # D'abord récupérer les chapitres actuels pour être sûr
    r = requests.get(f"{API}/dqe/projet/{PROJET_ID}", headers=hdr(token), timeout=30)
    r.raise_for_status()
    existing = r.json()
    if isinstance(existing, list):
        for ch in existing:
            ch_id = ch["id"]
            nb_lignes = len(ch.get("lignes", []))
            print(f"   Suppression chapitre id={ch_id} ({ch.get('numero')}: {ch.get('designation','')[:40]}, {nb_lignes} lignes)...")
            status = delete_chapitre(token, ch_id)
            print(f"   -> HTTP {status}")
            if status >= 400:
                # Essayer de supprimer les lignes d'abord
                print("   Suppression des lignes individuellement...")
                for lg in ch.get("lignes", []):
                    requests.delete(f"{API}/dqe/lignes/{lg['id']}", headers=hdr(token), timeout=30)
                status = delete_chapitre(token, ch_id)
                print(f"   -> Retry HTTP {status}")
    else:
        print("   Aucun chapitre existant trouvé.")

    # 4) Vérification suppression
    print("\n4) Vérification suppression...")
    r = requests.get(f"{API}/dqe/projet/{PROJET_ID}", headers=hdr(token), timeout=30)
    remaining = r.json() if r.status_code == 200 else []
    if isinstance(remaining, list) and len(remaining) > 0:
        print(f"   ATTENTION: {len(remaining)} chapitre(s) restant(s)!")
        for ch in remaining:
            print(f"   -> id={ch['id']} {ch.get('designation','')[:50]}")
    else:
        print("   OK — Projet 24 vidé.")

    # Re-login si nécessaire (token peut expirer pendant les suppressions)
    token = login()

    # 5) Création des chapitres et lignes
    print("\n5) Import des chapitres et lignes...")
    created_total = 0
    montant_total_cree = 0

    for ordre, (num, des, lines) in enumerate(chapters, 1):
        ch_id = create_chapitre(token, PROJET_ID, num, des, ordre)
        t = sum(l["montant"] for l in lines)
        print(f"\n   Chapitre {num} '{des[:40]}' créé (id={ch_id})")

        for i, l in enumerate(lines, 1):
            try:
                create_ligne(
                    token, ch_id,
                    l["num"], l["designation"], l["unite"],
                    l["quantite"], l["pu"], l["montant"], i
                )
                created_total += 1
                montant_total_cree += l["montant"]
            except Exception as e:
                print(f"   [ERR] Ligne {l['num']} '{l['designation'][:40]}': {e}")

            # Throttle légèrement pour éviter rate-limiting Render
            if i % 50 == 0:
                time.sleep(0.5)

        print(f"   -> {len(lines)} lignes créées, sous-total: {t:,.0f}")

    # 6) Vérification finale
    print("\n" + "=" * 60)
    print("6) VÉRIFICATION FINALE")
    token = login()
    r = requests.get(f"{API}/dqe/projet/{PROJET_ID}/summary", headers=hdr(token), timeout=30)
    if r.status_code == 200:
        s = r.json()
        print(f"   Chapitres  : {s.get('nombreChapitres')}")
        print(f"   Lignes     : {s.get('nombreLignes')}")
        print(f"   Montant DQE: {s.get('montantTotalDqe'):,.0f} FCFA")
        print(f"   Cible      : {cible:,.0f} FCFA")
        ecart_final = s.get("montantTotalDqe", 0) - cible
        if abs(ecart_final) < 10:
            print("   ✅ IMPORT RÉUSSI — montant conforme!")
        else:
            print(f"   ⚠️  Écart résiduel: {ecart_final:,.0f} FCFA")
    else:
        print(f"   Summary API error: {r.status_code}")

    print(f"\n   Lignes créées: {created_total}")
    print(f"   Montant total créé: {montant_total_cree:,.0f} FCFA")
    print("=" * 60)


if __name__ == "__main__":
    main()
