# -*- coding: utf-8 -*-
"""Analyse statistique BASE_DE_DONNEES_PRO.xlsx — écrit dans un fichier UTF-8."""
from collections import Counter, defaultdict
import openpyxl

path = "BASE_DE_DONNEES_PRO.xlsx"
out_path = "scripts/_excel_analysis_output.txt"
wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
ws = wb["Base de Données"]
rows = list(ws.iter_rows(values_only=True))
wb.close()

lines = []
lines.append("=== STRUCTURE ===")
lines.append(f"Total lignes brutes: {len(rows)}")
header_idx = None
for i, row in enumerate(rows):
    if not row or row[0] is None:
        continue
    a = str(row[0]).strip().upper()
    # Ligne titre stats contient "RÉFÉRENCES" — éviter confondre avec en-tête colonne RÉFÉRENCE
    if "RÉFÉRENCE" == a or a == "REFERENCE" or (a.startswith("RÉF") and "CORPS" not in str(row).upper()):
        if row[1] and str(row[1]).strip().upper().startswith("FOURN"):
            header_idx = i
            break
if header_idx is None:
    for i, row in enumerate(rows):
        if row and row[1] and str(row[1]).strip().upper().startswith("FOURN"):
            header_idx = i
            break

lines.append(f"Index ligne en-tête colonnes: {header_idx}")
hdr = rows[header_idx]
lines.append(f"En-têtes: {hdr}")

data_rows = rows[header_idx + 1 :]
lines.append(f"Lignes de données: {len(data_rows)}")

refs = []
fourn = []
cat = []
fam = []
des = []
unite = []
prix = []
keys_des_unite = []

for row in data_rows:
    if not row or row[0] is None:
        continue
    r0 = str(row[0]).strip()
    if not r0.startswith("MAT-"):
        continue
    refs.append(r0)
    fourn.append(str(row[1]).strip() if row[1] else "")
    cat.append(str(row[2]).strip() if row[2] else "")
    fam.append(str(row[3]).strip() if row[3] else "")
    des.append(str(row[4]).strip() if row[4] else "")
    unite.append(str(row[5]).strip() if row[5] else "")
    p = row[6]
    try:
        prix.append(float(p) if p is not None else None)
    except (TypeError, ValueError):
        prix.append(None)
    keys_des_unite.append((str(row[4]).strip().upper() if row[4] else "", str(row[5]).strip().upper() if row[5] else ""))

lines.append("\n=== UNICITÉ RÉFÉRENCE MAT ===")
lines.append(f"Rouges données MAT-: {len(refs)}")
lines.append(f"Références uniques: {len(set(refs))}")
dup_ref = [r for r, c in Counter(refs).items() if c > 1]
lines.append(f"Références en double (si >0): {len(dup_ref)}")
if dup_ref[:5]:
    lines.append(f"  Exemples: {dup_ref[:5]}")

lines.append("\n=== CLÉ DÉSIGNATION + UNITÉ ===")
key_counts = Counter(keys_des_unite)
lines.append(f"Paires (désignation, unité) uniques: {len(key_counts)}")
multi = [(k, c) for k, c in key_counts.items() if c > 1]
multi.sort(key=lambda x: -x[1])
lines.append(f"Paires avec >1 ligne (plusieurs fournisseurs ou doublons): {len(multi)}")
lines.append("Top 15 par nombre de lignes:")
for k, c in multi[:15]:
    lines.append(f"  {c} lignes | {k[0][:60]} | unit={k[1]}")

lines.append("\n=== FOURNISSEURS ===")
lines.append(f"Fournisseurs distincts: {len(set(fourn))}")
lines.append("Top 15 volume:")
for name, c in Counter(fourn).most_common(15):
    lines.append(f"  {c} | {name}")

lines.append("\n=== CATÉGORIE / FAMILLE ===")
lines.append(f"Catégories distinctes: {len(set(cat))}")
for name, c in Counter(cat).most_common(20):
    lines.append(f"  {c} | {name}")
lines.append(f"Familles distinctes: {len(set(fam))}")

lines.append("\n=== PRIX ===")
valid_p = [x for x in prix if x is not None]
lines.append(f"Prix numériques: {len(valid_p)} / {len(prix)}")
if valid_p:
    lines.append(f"Min {min(valid_p)} Max {max(valid_p)}")

text = "\n".join(lines)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)
print(text)
print(f"\n>>> Écrit aussi: {out_path}")
