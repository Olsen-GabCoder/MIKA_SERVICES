#!/usr/bin/env python3
"""
Ajoute en base UNIQUEMENT les lignes matériau de la feuille « Gros-Oeuvre »
du fichier Tout_Corps .xls qui ne sont PAS déjà présentes dans BASE DE DONNE F.xlsx
(même article + unité + fournisseur après résolution du nom).

- Fournisseurs : résolution vers un libellé du fichier BASE (pas d’abréviation quand un match existe).
- N’efface aucune donnée existante (merge incrémental).

Usage :
  python scripts/merge_gros_oeuvre_missing.py --dry-run
  python scripts/merge_gros_oeuvre_missing.py --execute

Prérequis : pymysql, openpyxl, xlrd ; variables DB dans backend/.env (DATABASE_URL, USERNAME, PASSWORD).
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import unicodedata
from decimal import Decimal

import openpyxl
import xlrd

# Chemins par défaut (racine projet)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS = os.path.join(ROOT, "docs")
ENV_PATH = os.path.join(ROOT, "backend", ".env")


def load_env(path: str) -> dict:
    out = {}
    if not os.path.isfile(path):
        return out
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            out[k] = v
    return out


def parse_jdbc_url(url: str) -> tuple[str, int, str]:
    import re as _re

    m = _re.match(r"jdbc:mysql://([^:/]+):(\d+)/([^?]+)", url)
    if not m:
        raise ValueError(f"URL JDBC MySQL non reconnue: {url[:60]}...")
    return m.group(1), int(m.group(2)), m.group(3)


def strip_accents(s: str) -> str:
    """Pour rapprocher Bernabé / BERNABE GABON."""
    if not s:
        return ""
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def norm_key(s: str | None) -> str:
    if s is None:
        return ""
    t = strip_accents(str(s).strip()).upper()
    t = re.sub(r"\s+", " ", t)
    return t


def load_base_keys_and_suppliers(xlsx_path: str) -> tuple[set[tuple[str, str, str]], list[str]]:
    """Clés (article, unite, fournisseur) + liste des noms fournisseurs distincts (libellés complets)."""
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active
    keys: set[tuple[str, str, str]] = set()
    suppliers: set[str] = set()
    for row in ws.iter_rows(min_row=2, min_col=5, max_col=8, values_only=True):
        art, u, prix, fourn = row[0], row[1], row[2], row[3]
        if fourn is None and art is None:
            continue
        fa = str(fourn).strip() if fourn is not None else ""
        ar = str(art).strip() if art is not None else ""
        un = str(u).strip() if u is not None else ""
        if not ar:
            continue
        keys.add((norm_key(ar), norm_key(un), norm_key(fa)))
        if fa:
            suppliers.add(fa)
    wb.close()
    return keys, sorted(suppliers, key=lambda x: x.upper())


def resolve_supplier(raw: str, canonicals: list[str]) -> str:
    """
    Associe un libellé court au nom complet du catalogue BASE si possible.
    Compare sans accents (Bernabé → BERNABE GABON).
    Sinon renvoie raw (trim) — à contrôler manuellement.
    """
    if not raw or not str(raw).strip():
        return raw
    s = str(raw).strip()
    su = strip_accents(s).upper()
    for c in canonicals:
        if strip_accents(c).upper() == su:
            return c
    for c in canonicals:
        cu = strip_accents(c).upper()
        if cu.startswith(su) and len(su) >= 3:
            return c
    for c in canonicals:
        cu = strip_accents(c).upper()
        if len(su) >= 4 and (su in cu):
            return c
    return s


def iter_gros_oeuvre_material_rows(xls_path: str):
    book = xlrd.open_workbook(xls_path, formatting_info=False)
    # feuille "Gros-Oeuvre" = index 1
    sh = book.sheet_by_index(1)

    def get_cell(r, c):
        if r >= sh.nrows or c >= sh.ncols:
            return None, None
        return sh.cell_value(r, c), sh.cell_type(r, c)

    def cell_str(r, c):
        v, t = get_cell(r, c)
        if t == xlrd.XL_CELL_TEXT:
            return str(v).strip() if v else None
        if t == xlrd.XL_CELL_NUMBER:
            if v == int(v):
                return str(int(v))
            return str(v)
        return None

    def cell_num(r, c):
        v, t = get_cell(r, c)
        if t == xlrd.XL_CELL_NUMBER:
            return float(v)
        return None

    def cell_fourn_text(r, c):
        v, t = get_cell(r, c)
        if t != xlrd.XL_CELL_TEXT:
            return None
        if not v:
            return None
        return str(v).strip() or None

    for ri in range(3, sh.nrows):
        materiaux = cell_str(ri, 2)
        prix = cell_num(ri, 4)
        fourn = cell_fourn_text(ri, 6)
        if not materiaux:
            continue
        if prix is None and not fourn:
            continue
        ref = cell_str(ri, 1) or "—"
        u = cell_str(ri, 3) or "u"
        contact = cell_str(ri, 7) or "—"
        date_prix = cell_str(ri, 5) or None
        prix_bd = Decimal(str(prix)) if prix is not None else Decimal("0")
        yield {
            "row_excel": ri + 1,
            "reference": ref[:50],
            "libelle": materiaux[:2000],
            "unite": u[:20],
            "prix_ttc": prix_bd.quantize(Decimal("0.01")),
            "fournisseur_brut": fourn,
            "contact": contact[:100],
            "date_prix": (date_prix or "")[:50] or None,
        }


def find_paths():
    base = os.path.join(DOCS, "BASE DE DONNE F.xlsx")
    xls = None
    for f in os.listdir(DOCS):
        if f.endswith(".xls") and "BAREME DES PRIX" in f and "Tout_Corps" in f:
            xls = os.path.join(DOCS, f)
            break
    if not os.path.isfile(base):
        raise FileNotFoundError(base)
    if not xls:
        raise FileNotFoundError("Fichier .xls Tout_Corps dans docs/")
    return base, xls


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true", help="Insérer en base (sinon dry-run)")
    args = ap.parse_args()
    dry = not args.execute

    base_path, xls_path = find_paths()
    base_keys, canonical_suppliers = load_base_keys_and_suppliers(base_path)

    to_insert: list[dict] = []
    seen: set[tuple[str, str, str]] = set()

    for row in iter_gros_oeuvre_material_rows(xls_path):
        fb = row["fournisseur_brut"]
        if fb:
            resolved = resolve_supplier(fb, canonical_suppliers)
            if not resolved or resolved.strip() == "":
                resolved = str(fb).strip()
        else:
            resolved = "Non renseigné"
        k = (norm_key(row["libelle"]), norm_key(row["unite"]), norm_key(resolved))
        if k in base_keys:
            continue
        if k in seen:
            continue
        seen.add(k)
        row["fournisseur_resolu"] = resolved
        to_insert.append(row)

    print(f"BASE : {len(base_keys)} clés (article+unité+fournisseur)")
    print(f"Gros-Oeuvre : lignes matière candidates hors doublon interne : {len(seen)}")
    print(f"À ajouter (absentes du fichier BASE) : {len(to_insert)}")

    if dry:
        for i, r in enumerate(to_insert[:30]):
            print(
                f"  [{i+1}] {r['libelle'][:50]!r} | {r['unite']!r} | "
                f"{r['prix_ttc']} | {r['fournisseur_brut']!r} -> {r['fournisseur_resolu']!r}"
            )
        if len(to_insert) > 30:
            print(f"  ... +{len(to_insert) - 30} lignes")
        print("\nMode dry-run : aucune écriture. Relancer avec --execute pour insérer.")
        return

    try:
        import pymysql
    except ImportError:
        print("pymysql requis : pip install pymysql", file=sys.stderr)
        sys.exit(1)

    env = load_env(ENV_PATH)
    url = env.get("DATABASE_URL", "")
    user = env.get("DATABASE_USERNAME", "root")
    password = env.get("DATABASE_PASSWORD", "")
    if not url:
        print("DATABASE_URL manquant dans backend/.env", file=sys.stderr)
        sys.exit(1)

    host, port, database = parse_jdbc_url(url)
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset="utf8mb4",
        autocommit=False,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM bareme_corps_etat WHERE code = %s LIMIT 1",
                ("GROS_OEUVRE",),
            )
            row = cur.fetchone()
            if row:
                corps_id = row[0]
            else:
                cur.execute(
                    "SELECT COALESCE(MAX(ordre_affichage),0)+1 FROM bareme_corps_etat"
                )
                ordre = cur.fetchone()[0]
                cur.execute(
                    """
                    INSERT INTO bareme_corps_etat (code, libelle, ordre_affichage, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(6), NOW(6))
                    """,
                    ("GROS_OEUVRE", "Gros-Oeuvre", ordre),
                )
                corps_id = cur.lastrowid

            cur.execute(
                """
                SELECT LOWER(TRIM(libelle)), LOWER(TRIM(COALESCE(unite,''))),
                       f.id, LOWER(TRIM(COALESCE(f.nom,'')))
                FROM bareme_lignes_prix l
                LEFT JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
                WHERE l.corps_etat_id = %s AND l.type = 'MATERIAU' AND l.parent_id IS NULL
                """,
                (corps_id,),
            )
            existing = set()
            for lib, un, _fid, fnom in cur.fetchall():
                existing.add(
                    (norm_key(lib or ""), norm_key(un or ""), norm_key(fnom or ""))
                )

            cur.execute(
                "SELECT COALESCE(MAX(ordre_ligne), 0) FROM bareme_lignes_prix WHERE corps_etat_id = %s",
                (corps_id,),
            )
            ordre = cur.fetchone()[0]

            inserted_lines = 0
            inserted_f = 0
            for r in to_insert:
                k = (
                    norm_key(r["libelle"]),
                    norm_key(r["unite"]),
                    norm_key(r["fournisseur_resolu"]),
                )
                if k in existing:
                    continue
                nom_f = r["fournisseur_resolu"] or "Non renseigné"
                cur.execute(
                    "SELECT id FROM bareme_fournisseurs WHERE LOWER(nom) = LOWER(%s) LIMIT 1",
                    (nom_f,),
                )
                fr = cur.fetchone()
                if fr:
                    fid = fr[0]
                else:
                    cur.execute(
                        """
                        INSERT INTO bareme_fournisseurs (nom, contact, created_at, updated_at)
                        VALUES (%s, %s, NOW(6), NOW(6))
                        """,
                        (nom_f[:200], (r["contact"] or "—")[:100]),
                    )
                    fid = cur.lastrowid
                    inserted_f += 1

                ordre += 1
                dp = r["date_prix"] or ""
                cur.execute(
                    """
                    INSERT INTO bareme_lignes_prix (
                        corps_etat_id, type, reference, libelle, famille, unite, prix_ttc, date_prix,
                        fournisseur_bareme_id, contact_texte, ordre_ligne, numero_ligne_excel,
                        prix_estime, created_at, updated_at, parent_id
                    ) VALUES (
                        %s, 'MATERIAU', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, NOW(6), NOW(6), NULL
                    )
                    """,
                    (
                        corps_id,
                        r["reference"],
                        r["libelle"],
                        "Gros-Oeuvre",
                        r["unite"],
                        str(r["prix_ttc"]),
                        dp[:50] if dp else None,
                        fid,
                        (r["contact"] or "—")[:100],
                        ordre,
                        r["row_excel"],
                    ),
                )
                inserted_lines += 1
                existing.add(k)

        conn.commit()
        print(f"OK : {inserted_f} nouveau(x) fournisseur(s), {inserted_lines} ligne(s) matériau insérée(s).")
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    main()
