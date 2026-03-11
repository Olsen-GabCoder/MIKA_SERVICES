#!/usr/bin/env python3
"""
Peuplement direct de la base mika_services_dev à partir du fichier Excel barème.
Usage: python import_bareme_to_db.py [chemin_excel]
Par défaut: ../docs/BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls
"""
import os
import sys
import re
from decimal import Decimal
from datetime import datetime

try:
    import xlrd
except ImportError:
    print("Installer xlrd: pip install xlrd")
    sys.exit(1)
try:
    import pymysql
except ImportError:
    print("Installer pymysql: pip install pymysql")
    sys.exit(1)

# Config base (alignée sur application-dev.yml)
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "olsenk2000#2000",
    "database": "mika_services_dev",
    "charset": "utf8mb4",
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_XLS = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "docs", "BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls"))


def cell_str(sheet, row, col):
    try:
        v = sheet.cell_value(row, col)
        if v is None:
            return None
        if isinstance(v, float):
            if v == int(v):
                return str(int(v))
            return str(v)
        return str(v).strip() or None
    except Exception:
        return None


def cell_num(sheet, row, col):
    try:
        v = sheet.cell_value(row, col)
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip().replace(",", ".")
        return float(s) if s else None
    except Exception:
        return None


def main():
    xls_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_XLS
    if not os.path.isfile(xls_path):
        print(f"Fichier introuvable: {xls_path}")
        sys.exit(1)

    print(f"Ouverture Excel: {xls_path}")
    book = xlrd.open_workbook(xls_path, encoding_override="cp1252")

    conn = pymysql.connect(**DB_CONFIG)
    conn.autocommit = False
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        with conn.cursor() as cur:
            # 1) Vider les tables (ordre FK)
            print("Vidage des tables barème...")
            cur.execute("DELETE FROM bareme_lignes_prix")
            cur.execute("DELETE FROM bareme_coefficients_eloignement")
            cur.execute("DELETE FROM bareme_fournisseurs")
            cur.execute("DELETE FROM bareme_corps_etat")

            # 2) Coefficients d'éloignement (feuille 0, à partir de la ligne 3)
            sheet0 = book.sheet_by_index(0)
            nb_coef = 0
            for r in range(3, sheet0.nrows):
                ville = cell_str(sheet0, r, 0)
                if not ville:
                    continue
                pct = cell_num(sheet0, r, 1)
                coef = cell_num(sheet0, r, 2)
                if coef is None:
                    continue
                note = cell_str(sheet0, r, 3)
                cur.execute(
                    """INSERT INTO bareme_coefficients_eloignement (nom, pourcentage, coefficient, note, ordre_affichage, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (ville[:100], round(pct, 2) if pct is not None else None, round(coef, 2), (note or "")[:2000], nb_coef, now, now),
                )
                nb_coef += 1
            print(f"  Coefficients d'éloignement: {nb_coef}")

            # 3) Feuilles 1 à 15 — corps d'état et lignes
            fournisseurs = {}  # nom_lower -> id
            corps_etat_ids = {}  # code -> id
            nb_corps = 0
            nb_fourn = 0
            nb_lignes = 0
            parent_id_by_sheet = {}  # sheet_index -> last PRESTATION_ENTETE id

            for sheet_idx in range(1, min(16, book.nsheets)):
                sheet = book.sheet_by_index(sheet_idx)
                name = sheet.name.strip()
                if not name or name.lower() == "sheet1":
                    continue

                code = re.sub(r"[^A-Z0-9_]", "_", name.upper())[:80]
                if code not in corps_etat_ids:
                    cur.execute(
                        """INSERT INTO bareme_corps_etat (code, libelle, ordre_affichage, created_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (code, name[:200], sheet_idx, now, now),
                    )
                    corps_etat_ids[code] = cur.lastrowid
                    nb_corps += 1
                corps_id = corps_etat_ids[code]
                current_parent = parent_id_by_sheet.get(sheet_idx)
                ordre = 0

                for r in range(3, sheet.nrows):
                    ref = cell_str(sheet, r, 1)
                    materiaux = cell_str(sheet, r, 2)
                    u = cell_str(sheet, r, 3)
                    prix_ttc = cell_num(sheet, r, 4)
                    date_prix = cell_str(sheet, r, 5)
                    fourn_nom = cell_str(sheet, r, 6)
                    contact = cell_str(sheet, r, 7)
                    libelle = cell_str(sheet, r, 8)
                    qte = cell_num(sheet, r, 9)
                    pu = cell_num(sheet, r, 10)
                    u2 = cell_str(sheet, r, 11)
                    sommes = cell_num(sheet, r, 12)
                    debourse = cell_num(sheet, r, 13)
                    pv = cell_num(sheet, r, 14)
                    coef_pv = cell_num(sheet, r, 15)

                    has_material = bool(materiaux and (prix_ttc is not None or fourn_nom))
                    has_presta_libelle = bool(libelle)
                    has_presta_detail = qte is not None and pu is not None
                    has_presta_total = debourse is not None or pv is not None

                    # coefficient_pv = DECIMAL(4,2), typiquement 1.4 ou 1.6 ; ignorer si > 10 (souvent P.V lu à tort)
                    coef_pv_safe = None
                    if coef_pv is not None and 0 < coef_pv <= 10:
                        coef_pv_safe = round(coef_pv, 2)

                    # Ligne matériau
                    if has_material:
                        fourn_id = None
                        if fourn_nom:
                            key = fourn_nom.strip().lower()[:200]
                            if key not in fournisseurs:
                                cur.execute(
                                    """INSERT INTO bareme_fournisseurs (nom, contact, created_at, updated_at) VALUES (%s, %s, %s, %s)""",
                                    (fourn_nom.strip()[:200], (contact or "")[:100], now, now),
                                )
                                fournisseurs[key] = cur.lastrowid
                                nb_fourn += 1
                            fourn_id = fournisseurs[key]
                        cur.execute(
                            """INSERT INTO bareme_lignes_prix (corps_etat_id, type, reference, libelle, unite, prix_ttc, date_prix, fournisseur_bareme_id, contact_texte, ordre_ligne, numero_ligne_excel, created_at, updated_at)
                               VALUES (%s, 'MATERIAU', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            (
                                corps_id,
                                (ref or "")[:50],
                                (materiaux or "")[:2000],
                                (u or "")[:20],
                                round(prix_ttc, 2) if prix_ttc is not None else None,
                                (date_prix or "")[:50],
                                fourn_id,
                                (contact or "")[:100],
                                ordre,
                                r + 1,
                                now,
                                now,
                            ),
                        )
                        ordre += 1
                        nb_lignes += 1

                    # Lignes prestation
                    if has_presta_total and not has_presta_detail and not has_presta_libelle:
                        cur.execute(
                            """INSERT INTO bareme_lignes_prix (corps_etat_id, type, unite_prestation, debourse, prix_vente, coefficient_pv, parent_id, ordre_ligne, numero_ligne_excel, created_at, updated_at)
                               VALUES (%s, 'PRESTATION_TOTAL', %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            (
                                corps_id,
                                (u2 or "")[:20],
                                round(debourse, 2) if debourse is not None else None,
                                round(pv, 2) if pv is not None else None,
                                coef_pv_safe,
                                current_parent,
                                ordre,
                                r + 1,
                                now,
                                now,
                            ),
                        )
                        ordre += 1
                        nb_lignes += 1
                        current_parent = None
                    elif has_presta_total and (has_presta_detail or has_presta_libelle):
                        if has_presta_detail:
                            cur.execute(
                                """INSERT INTO bareme_lignes_prix (corps_etat_id, type, libelle, quantite, prix_unitaire, unite_prestation, somme, parent_id, ordre_ligne, numero_ligne_excel, created_at, updated_at)
                                   VALUES (%s, 'PRESTATION_LIGNE', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                                (
                                    corps_id,
                                    (libelle or "")[:2000],
                                    round(qte, 4),
                                    round(pu, 2),
                                    (u2 or "")[:20],
                                    round(sommes, 2) if sommes is not None else None,
                                    current_parent,
                                    ordre,
                                    r + 1,
                                    now,
                                    now,
                                ),
                            )
                            ordre += 1
                            nb_lignes += 1
                        cur.execute(
                            """INSERT INTO bareme_lignes_prix (corps_etat_id, type, libelle, unite_prestation, debourse, prix_vente, coefficient_pv, parent_id, ordre_ligne, numero_ligne_excel, created_at, updated_at)
                               VALUES (%s, 'PRESTATION_TOTAL', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            (
                                corps_id,
                                (libelle or "")[:2000] if not has_presta_detail else None,
                                (u2 or "")[:20],
                                round(debourse, 2) if debourse is not None else None,
                                round(pv, 2) if pv is not None else None,
                                coef_pv_safe,
                                current_parent,
                                ordre,
                                r + 1,
                                now,
                                now,
                            ),
                        )
                        ordre += 1
                        nb_lignes += 1
                        current_parent = None
                    elif has_presta_detail:
                        cur.execute(
                            """INSERT INTO bareme_lignes_prix (corps_etat_id, type, libelle, quantite, prix_unitaire, unite_prestation, somme, parent_id, ordre_ligne, numero_ligne_excel, created_at, updated_at)
                               VALUES (%s, 'PRESTATION_LIGNE', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            (
                                corps_id,
                                (libelle or "")[:2000],
                                round(qte, 4),
                                round(pu, 2),
                                (u2 or "")[:20],
                                round(sommes, 2) if sommes is not None else None,
                                current_parent,
                                ordre,
                                r + 1,
                                now,
                                now,
                            ),
                        )
                        ordre += 1
                        nb_lignes += 1
                    elif has_presta_libelle and not has_presta_detail and not has_presta_total:
                        cur.execute(
                            """INSERT INTO bareme_lignes_prix (corps_etat_id, type, libelle, parent_id, ordre_ligne, numero_ligne_excel, created_at, updated_at)
                               VALUES (%s, 'PRESTATION_ENTETE', %s, NULL, %s, %s, %s, %s)""",
                            (corps_id, (libelle or "").strip()[:2000], ordre, r + 1, now, now),
                        )
                        current_parent = cur.lastrowid
                        parent_id_by_sheet[sheet_idx] = current_parent
                        ordre += 1
                        nb_lignes += 1

        conn.commit()
        print(f"Corps d'état: {nb_corps}, Fournisseurs: {nb_fourn}, Lignes: {nb_lignes}")
        print("Import terminé avec succès.")

        # Vérification
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM bareme_coefficients_eloignement")
        print(f"Vérif. coefficients: {cur.fetchone()[0]}")
        cur.execute("SELECT COUNT(*) FROM bareme_corps_etat")
        print(f"Vérif. corps_etat: {cur.fetchone()[0]}")
        cur.execute("SELECT COUNT(*) FROM bareme_fournisseurs")
        print(f"Vérif. fournisseurs: {cur.fetchone()[0]}")
        cur.execute("SELECT COUNT(*) FROM bareme_lignes_prix")
        print(f"Vérif. lignes_prix: {cur.fetchone()[0]}")
        cur.close()

    except Exception as e:
        conn.rollback()
        print(f"Erreur: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
