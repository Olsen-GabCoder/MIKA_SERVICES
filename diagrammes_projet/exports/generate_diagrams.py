"""
generate_diagrams.py
Génère un fichier Word (.docx) contenant tous les diagrammes de classes Mika Services.
Étapes :
  1. Lit les 12 fichiers MD (01 → 12)
  2. Extrait chaque bloc ```mermaid ... ``` et le rend en PNG via mmdc
  3. Assemble un markdown intermédiaire avec les images
  4. Convertit en DOCX avec pandoc
"""

import os
import re
import subprocess
import sys
import shutil
from pathlib import Path

# Force UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR   = Path("C:/Projet_Mika_Services/diagrammes_projet")
EXPORT_DIR = BASE_DIR / "exports"
EXPORT_DIR.mkdir(exist_ok=True)

# Fichiers à traiter dans l'ordre (on ignore le 00_ trop volumineux pour mmdc)
MD_FILES = sorted(f for f in BASE_DIR.glob("[0-9][0-9]_*.md")
                  if not f.name.startswith("00_"))

print(f"Fichiers trouvés : {[f.name for f in MD_FILES]}")

def extract_mermaid_blocks(md_text):
    """Retourne une liste de (bloc_complet, code_mermaid)."""
    pattern = re.compile(r"```mermaid\n(.*?)```", re.DOTALL)
    return [(m.group(0), m.group(1).strip()) for m in pattern.finditer(md_text)]

def render_mermaid(code: str, out_png: Path, width=2400, height=1600) -> bool:
    """Rend un bloc Mermaid en PNG via npx mmdc. Retourne True si succès."""
    mmd_file = out_png.with_suffix(".mmd")
    mmd_file.write_text(code, encoding="utf-8")
    # Sur Windows, npx est un .cmd → shell=True obligatoire
    cmd = (
        f'npx mmdc'
        f' -i "{mmd_file}"'
        f' -o "{out_png}"'
        f' -w {width}'
        f' -H {height}'
        f' --backgroundColor white'
    )
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180, shell=True)
    if result.returncode != 0:
        print(f"  [WARN] Erreur mmdc : {result.stderr[:200]}")
        return False
    return out_png.exists()

# ─── Étape 1 : extraction et rendu PNG ───────────────────────────────────────
combined_md_parts = []
combined_md_parts.append("---\n")
combined_md_parts.append("title: Diagrammes de Classes — Mika Services Platform\n")
combined_md_parts.append("author: Généré automatiquement depuis le code Kotlin\n")
combined_md_parts.append(f"date: 2026-04-13\n")
combined_md_parts.append("---\n\n")
combined_md_parts.append("# Diagrammes de Classes — Mika Services Platform\n\n")
combined_md_parts.append("\\newpage\n\n")

total_diagrams = 0
total_errors   = 0

for md_file in MD_FILES:
    print(f"\n[MD] Traitement : {md_file.name}")
    md_text = md_file.read_text(encoding="utf-8")

    # Titre du fichier
    title_match = re.match(r"#\s+(.+)", md_text)
    title = title_match.group(1) if title_match else md_file.stem

    # Contenu sans les blocs mermaid (on les remplace par images)
    new_md = md_text
    blocks = extract_mermaid_blocks(md_text)
    print(f"  -> {len(blocks)} bloc(s) Mermaid trouves")

    for idx, (full_block, code) in enumerate(blocks, 1):
        png_name = f"{md_file.stem}_diag{idx:02d}.png"
        png_path = EXPORT_DIR / png_name
        print(f"  [IMG] Rendu -> {png_name} ...", end=" ", flush=True)

        ok = render_mermaid(code, png_path)
        if ok:
            print("OK")
            total_diagrams += 1
            img_tag = f"\n![{title} — diagramme {idx}]({png_path})\n"
            new_md = new_md.replace(full_block, img_tag, 1)
        else:
            print("ERREUR (conserve en texte)")
            total_errors += 1

    combined_md_parts.append(new_md)
    combined_md_parts.append("\n\\newpage\n\n")

# ─── Étape 2 : écriture du markdown intermédiaire ─────────────────────────────
combined_md_path = EXPORT_DIR / "combined.md"
combined_md_path.write_text("".join(combined_md_parts), encoding="utf-8")
print(f"\n[OK] Markdown intermediaire : {combined_md_path}")

# ─── Étape 3 : conversion DOCX avec pandoc ────────────────────────────────────
docx_out = EXPORT_DIR / "Mika_Services_Diagrammes_Classes.docx"
cmd_docx = (
    f'pandoc "{combined_md_path}" -o "{docx_out}"'
    f' --from markdown --to docx --toc --toc-depth=2 --dpi=150'
)
print(f"\n[DOCX] Generation : {docx_out.name} ...")
res = subprocess.run(cmd_docx, capture_output=True, text=True, shell=True)
if res.returncode == 0 and docx_out.exists():
    size_mb = docx_out.stat().st_size / 1024 / 1024
    print(f"[OK] DOCX genere : {docx_out} ({size_mb:.1f} Mo)")
else:
    print(f"[ERREUR] pandoc DOCX : {res.stderr}")

# ─── Étape 4 : tentative PDF via pandoc html ──────────────────────────────────
pdf_out = EXPORT_DIR / "Mika_Services_Diagrammes_Classes.pdf"
cmd_pdf = (
    f'pandoc "{combined_md_path}" -o "{pdf_out}"'
    f' --from markdown --pdf-engine=wkhtmltopdf --toc --dpi=150'
)
print(f"\n[PDF] Tentative via wkhtmltopdf ...")
res_pdf = subprocess.run(cmd_pdf, capture_output=True, text=True, shell=True)
if res_pdf.returncode == 0 and pdf_out.exists():
    size_mb = pdf_out.stat().st_size / 1024 / 1024
    print(f"[OK] PDF genere : {pdf_out} ({size_mb:.1f} Mo)")
else:
    print(f"[INFO] PDF non disponible ({res_pdf.stderr[:100]}), le DOCX suffit.")

# ─── Résumé ───────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print(f"  Diagrammes rendus : {total_diagrams}")
print(f"  Erreurs           : {total_errors}")
print(f"  Sortie Word       : {docx_out}")
print("="*60)
