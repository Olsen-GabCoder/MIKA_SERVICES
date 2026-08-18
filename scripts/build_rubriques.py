#!/usr/bin/env python
"""Matrice de remplissage des rubriques projet par responsable — PRODUCTION."""
import json, urllib.request, ssl, collections
from datetime import datetime

ctx = ssl.create_default_context()
BASE = "https://mika-services-backend.onrender.com/api"

login_data = json.dumps({"email":"olsenkampala@gmail.com","password":"Olsenk2000#2000"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login", data=login_data, headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
    TOKEN = json.loads(resp.read())["accessToken"]
print(f"Connecte: {BASE}")

def api(path):
    req = urllib.request.Request(f"{BASE}{path}", headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def iso_week(dt_str):
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", ""))
        y, w, _ = dt.isocalendar()
        return (y, w)
    except:
        return None

def month_to_week(annee, mois):
    """Suivi mensuel: rattache au 15 du mois -> semaine ISO."""
    try:
        dt = datetime(int(annee), int(mois), 15)
        y, w, _ = dt.isocalendar()
        return (y, w)
    except:
        return None

WEEKS = [(2026, w) for w in range(12, 27)]
WEEK_LABELS = [f"S{w}" for _, w in WEEKS]
RUBRIQUES = ["taches", "previsions", "suivi_mensuel", "points_bloquants", "dqe"]
N = len(RUBRIQUES)

# 1. Projects + responsables
listing = api("/projets?page=0&size=100")
projets = listing.get("content", [])
proj_ids = [p["id"] for p in projets]

proj_detail = {}
for pid in proj_ids:
    proj_detail[pid] = api(f"/projets/{pid}")

proj_resp = {}
resp_projets = collections.defaultdict(list)
for pid, d in proj_detail.items():
    resp = d.get("responsableProjet")
    if resp and isinstance(resp, dict):
        nom = f"{resp.get('prenom','').strip()} {resp.get('nom','').strip()}".strip()
        proj_resp[pid] = nom
        resp_projets[nom].append(pid)
    else:
        proj_resp[pid] = None

print(f"Projets: {len(proj_ids)}, Responsables: {len(resp_projets)}")

# 2. Fetch elements
totals = {"taches": 0, "previsions": 0, "suivi_mensuel": 0, "points_bloquants": 0, "dqe": 0}
resp_week_rub = collections.defaultdict(lambda: collections.defaultdict(set))
resp_rub_weeks = collections.defaultdict(lambda: collections.defaultdict(set))

for pid in proj_ids:
    rn = proj_resp[pid]

    # TACHES
    try:
        pg = 0
        while True:
            d = api(f"/planning/taches/projet/{pid}?page={pg}&size=500")
            items = d.get("content", [])
            totals["taches"] += len(items)
            if rn:
                for t in items:
                    wk = iso_week(t.get("createdAt"))
                    if wk and wk in WEEKS:
                        resp_week_rub[rn][wk].add("taches")
                        resp_rub_weeks[rn]["taches"].add(wk)
            if len(items) < 500:
                break
            pg += 1
    except:
        pass

    # PREVISIONS
    try:
        prevs = api(f"/projets/{pid}/previsions")
        if isinstance(prevs, list):
            totals["previsions"] += len(prevs)
            if rn:
                for pv in prevs:
                    a, s = pv.get("annee"), pv.get("semaine")
                    if a and s:
                        wk = (int(a), int(s))
                        if wk in WEEKS:
                            resp_week_rub[rn][wk].add("previsions")
                            resp_rub_weeks[rn]["previsions"].add(wk)
    except:
        pass

    # SUIVI MENSUEL
    try:
        sm = api(f"/projets/{pid}/suivi-mensuel")
        if isinstance(sm, list):
            totals["suivi_mensuel"] += len(sm)
            if rn:
                for s in sm:
                    wk = month_to_week(s.get("annee"), s.get("mois"))
                    if wk and wk in WEEKS:
                        resp_week_rub[rn][wk].add("suivi_mensuel")
                        resp_rub_weeks[rn]["suivi_mensuel"].add(wk)
    except:
        pass

    # POINTS BLOQUANTS
    try:
        d = api(f"/points-bloquants/projet/{pid}")
        pbl = d.get("content", d) if isinstance(d, dict) else d
        if isinstance(pbl, list):
            totals["points_bloquants"] += len(pbl)
            if rn:
                for pb in pbl:
                    wk = iso_week(pb.get("createdAt"))
                    if wk and wk in WEEKS:
                        resp_week_rub[rn][wk].add("points_bloquants")
                        resp_rub_weeks[rn]["points_bloquants"].add(wk)
    except:
        pass

    # DQE
    try:
        dqe = api(f"/dqe/projet/{pid}")
        if isinstance(dqe, list):
            nb = sum(len(c.get("lignes", [])) for c in dqe)
            totals["dqe"] += nb
            if rn:
                for chap in dqe:
                    wk = iso_week(chap.get("createdAt"))
                    if wk and wk in WEEKS:
                        resp_week_rub[rn][wk].add("dqe")
                        resp_rub_weeks[rn]["dqe"].add(wk)
                    for ligne in chap.get("lignes", []):
                        wk = iso_week(ligne.get("createdAt"))
                        if wk and wk in WEEKS:
                            resp_week_rub[rn][wk].add("dqe")
                            resp_rub_weeks[rn]["dqe"].add(wk)
    except:
        pass

# 3. Build matrix rows
rows = []
for rn in resp_week_rub:
    row = {
        "responsable": rn,
        "projets": sorted(resp_projets[rn]),
        "nb_projets": len(resp_projets[rn]),
        "semaines": {},
        "pct_list": [],
    }
    for yw in WEEKS:
        label = f"S{yw[1]}"
        fed = resp_week_rub[rn].get(yw, set())
        x = len(fed)
        pct = x * 100 // N
        row["semaines"][label] = {"x": x, "n": N, "pct": pct, "rubriques": sorted(fed)}
        row["pct_list"].append(pct)

    row["pct_global"] = round(sum(row["pct_list"]) / 15, 1)
    row["rubriques_detail"] = {}
    for rub in RUBRIQUES:
        wks = resp_rub_weeks[rn].get(rub, set())
        wks_in = {w for w in wks if w in WEEKS}
        row["rubriques_detail"][rub] = len(wks_in)
    rows.append(row)

rows.sort(key=lambda r: -r["pct_global"])

# 4. Partie 2 — besoins
besoins = []
for rn, pids in sorted(resp_projets.items()):
    nb = len(pids)
    bh = sum(1 for pid in pids if (proj_detail[pid].get("besoinsHumain") or "").strip())
    bm = sum(1 for pid in pids if (proj_detail[pid].get("besoinsMateriel") or "").strip())
    besoins.append({
        "responsable": rn,
        "nb_projets": nb,
        "besoinsHumain_rempli": bh,
        "besoinsHumain_pct": round(bh * 100 / nb) if nb else 0,
        "besoinsMateriel_rempli": bm,
        "besoinsMateriel_pct": round(bm * 100 / nb) if nb else 0,
    })

# ============================================================
# PRINT
# ============================================================
print("\n" + "=" * 130)
print("PARTIE 1 — MATRICE HEBDOMADAIRE DE REMPLISSAGE (N=5)")
print("Rubriques: Taches | Previsions | Suivi mensuel | Points bloquants | DQE")
print("Suivi mensuel: rattache au 15 du mois -> semaine ISO")
print("% global = moyenne(x/5*100 pour chaque semaine) / 15 semaines")
print("=" * 130)

hdr = f"{'Responsable':<28}" + "".join(f"{s:>7}" for s in WEEK_LABELS) + f"{'%Glob':>7}"
print(hdr)
print("-" * len(hdr))
for r in rows:
    line = f"{r['responsable'][:27]:<28}"
    for s in WEEK_LABELS:
        x = r["semaines"][s]["x"]
        if x > 0:
            line += f"   {x}/5 "
        else:
            line += "     . "
    line += f" {r['pct_global']:>5.1f}%"
    print(line)

print(f"\n{'DETAIL: semaines actives par rubrique (/15)'}")
hdr2 = f"{'Responsable':<28}{'Taches':>10}{'Previs':>10}{'Suivi':>10}{'PtBloq':>10}{'DQE':>10}"
print(hdr2)
print("-" * len(hdr2))
for r in rows:
    rd = r["rubriques_detail"]
    line = f"{r['responsable'][:27]:<28}"
    for rub in RUBRIQUES:
        line += f"{rd[rub]:>6}/15  "
    print(line)

print("\n" + "=" * 80)
print("PARTIE 2 — CHAMPS NON DATABLES (photo au 25/06/2026)")
print("=" * 80)
hdr3 = f"{'Responsable':<28}{'Projets':>8}{'BesoinsHumain':>20}{'BesoinsMateriel':>20}"
print(hdr3)
print("-" * len(hdr3))
for b in besoins:
    bh = f"{b['besoinsHumain_rempli']}/{b['nb_projets']} ({b['besoinsHumain_pct']}%)"
    bm = f"{b['besoinsMateriel_rempli']}/{b['nb_projets']} ({b['besoinsMateriel_pct']}%)"
    print(f"{b['responsable'][:27]:<28}{b['nb_projets']:>8}{bh:>20}{bm:>20}")

print("\n=== CONTROLE DE COHERENCE ===")
exp = {"taches": 719, "previsions": 467, "suivi_mensuel": 161, "points_bloquants": 43, "dqe": 594}
for k, e in exp.items():
    a = totals[k]
    print(f"  {k:<20} attendu={e:>5}  obtenu={a:>5}  -> {'OK' if a == e else 'ECART'}")

# Save
output = {
    "_metadata": {
        "source": "Production Render — API REST",
        "date": "2026-06-25",
        "N_rubriques": N,
        "rubriques": RUBRIQUES,
        "regle_suivi_mensuel": "Rattache au 15 du mois -> semaine ISO",
        "formule_pct_global": "sum(x_i/5*100 pour i=S12..S26) / 15",
        "controle": {k: {"attendu": exp[k], "obtenu": totals[k], "ok": totals[k] == exp[k]} for k in exp},
    },
    "partie1_matrice": [{
        "responsable": r["responsable"],
        "projets": r["projets"],
        "nb_projets": r["nb_projets"],
        "pct_global": r["pct_global"],
        "semaines": {s: {"x": r["semaines"][s]["x"], "pct": r["semaines"][s]["pct"], "rubriques": r["semaines"][s]["rubriques"]} for s in WEEK_LABELS},
        "rubriques_semaines_actives": r["rubriques_detail"],
    } for r in rows],
    "partie2_champs_non_datables": besoins,
}
with open("C:/Projet_Mika_Services/remplissage_rubriques_projet.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print("\nJSON: remplissage_rubriques_projet.json")
