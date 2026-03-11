# -*- coding: utf-8 -*-
"""
Réorganise les données du barème Excel en tableaux Markdown structurés
dans ANALYSE_BAREME_PRIX_BATIMENT.md.
"""
import os
import re

try:
    import xlrd
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "xlrd", "-q"])
    import xlrd


def safe_cell(v):
    """Valeur cellule pour affichage, sans caractères qui cassent les tableaux MD."""
    if v is None:
        return "-"
    if isinstance(v, float):
        if v == int(v):
            v = int(v)
        else:
            v = round(v, 4) if abs(v - round(v, 4)) < 1e-9 else v
    s = str(v).strip()
    s = s.replace("|", "\\|").replace("\n", " ").replace("\r", " ")
    return s if s else "-"


def build_coef_table(sh):
    """Feuille Coef d'éloignement : tableau Ville | % | Coef | Note."""
    lines = []
    lines.append("| Ville / Localité | % | Coef | Note |")
    lines.append("|------------------|---|------|------|")
    for r in range(4, min(42, sh.nrows)):
        cells = [safe_cell(sh.cell_value(r, c)) for c in range(5)]
        ville, pct, coef, col4, note = cells[0], cells[1], cells[2], cells[3], cells[4]
        if note == "-" and col4 != "-":
            note = col4
        lines.append("| " + " | ".join([ville, str(pct), str(coef), note]) + " |")
    return "\n".join(lines)


def build_sheet_table(sh, sheet_name):
    """Feuille corps d'état : tableau avec en-têtes (ligne 2) et toutes les lignes de données."""
    ncols = sh.ncols
    nrows = sh.nrows
    if nrows < 3:
        return "*Aucune donnée.*"

    # En-têtes depuis la ligne 2 (index 2)
    headers = []
    for c in range(ncols):
        h = safe_cell(sh.cell_value(2, c))
        if not h or h == "-":
            h = "Col" + str(c + 1)
        headers.append(h)

    header_line = "| " + " | ".join(headers) + " |"
    sep = "|" + "|".join(["---"] * ncols) + "|"

    lines = [header_line, sep]

    for r in range(3, nrows):
        row_cells = []
        for c in range(ncols):
            row_cells.append(safe_cell(sh.cell_value(r, c)))
        lines.append("| " + " | ".join(row_cells) + " |")

    return "\n".join(lines)


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    xls_path = os.path.join(base, "BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls")
    md_path = os.path.join(base, "ANALYSE_BAREME_PRIX_BATIMENT.md")

    if not os.path.exists(xls_path):
        print("Fichier Excel introuvable:", xls_path)
        return
    if not os.path.exists(md_path):
        print("Fichier MD introuvable:", md_path)
        return

    # Lire le MD jusqu'à la section données (exclue)
    with open(md_path, "r", encoding="utf-8") as f:
        full_md = f.read()

    # Couper au début de la section données brutes (conserver tout ce qui précède)
    marker = "\n---\n\n# DONNÉES BRUTES COMPLÈTES"
    if marker in full_md:
        md_before = full_md.split(marker)[0].rstrip()
    else:
        md_before = full_md.rstrip()

    # Charger le classeur
    wb = xlrd.open_workbook(xls_path)
    sheet_names = wb.sheet_names()

    # Construire la nouvelle section organisée
    sections = []
    sections.append("")
    sections.append("---")
    sections.append("")
    sections.append("# DONNÉES DU BARÈME — ORGANISÉES PAR FEUILLE")
    sections.append("")
    sections.append("Les tableaux ci-dessous reprennent **toutes** les lignes du fichier Excel, avec des en-têtes de colonnes explicites. Chaque feuille est présentée dans un tableau unique pour faciliter la recherche et l’exploitation.")
    sections.append("")
    sections.append("## Sommaire des feuilles")
    sections.append("")
    toc = "| # | Feuille | Lignes | Colonnes |"
    toc += "\n|---|---------|--------|----------|"
    for i, name in enumerate(sheet_names, 1):
        sh = wb.sheet_by_name(name)
        toc += "\n| {} | {} | {} | {} |".format(i, name.replace("|", "\\|"), sh.nrows, sh.ncols)
    sections.append(toc)
    sections.append("")

    for idx, name in enumerate(sheet_names):
        sh = wb.sheet_by_index(idx)
        sections.append("---")
        sections.append("")
        sections.append("## {} — {}".format(idx + 1, name))
        sections.append("")
        sections.append("*Lignes : {} | Colonnes : {}*".format(sh.nrows, sh.ncols))
        sections.append("")

        if name == "Sheet1" and sh.nrows == 0:
            sections.append("*Feuille vide.*")
            sections.append("")
            continue

        # Première feuille = coefficients d'éloignement (villes)
        if idx == 0 and sh.ncols <= 5 and sh.nrows <= 50:
            sections.append(build_coef_table(sh))
        else:
            sections.append(build_sheet_table(sh, name))

        sections.append("")

    new_section = "\n".join(sections)
    final_md = md_before + new_section

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(final_md)

    total_rows = sum(wb.sheet_by_index(i).nrows for i in range(wb.nsheets))
    print("OK: ANALYSE_BAREME_PRIX_BATIMENT.md mis à jour avec données organisées en tableaux.")
    print("  Feuilles:", len(sheet_names), "| Lignes de données totales:", total_rows)


if __name__ == "__main__":
    main()
