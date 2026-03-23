#!/usr/bin/env python3
from __future__ import annotations

import os
from urllib.parse import urlparse

import openpyxl
import pymysql

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(ROOT, "backend", ".env")
OUT_PATH = os.path.join(ROOT, "docs", "BAREME_EXPORT_LOCAL_FOR_API_IMPORT.xlsx")


def load_env(path: str) -> dict[str, str]:
    out: dict[str, str] = {}
    if not os.path.isfile(path):
        return out
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def parse_mysql_jdbc(url: str) -> tuple[str, int, str]:
    parsed = urlparse(url.replace("jdbc:", "", 1))
    return parsed.hostname or "localhost", int(parsed.port or 3306), (parsed.path or "/").lstrip("/")


def main() -> None:
    env = load_env(ENV_PATH)
    host, port, db = parse_mysql_jdbc(env["DATABASE_URL"])
    conn = pymysql.connect(
        host=host,
        port=port,
        user=env.get("DATABASE_USERNAME", "root"),
        password=env.get("DATABASE_PASSWORD", ""),
        database=db,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  l.ref_reception AS ref_reception,
                  l.code_fournisseur AS code_fournisseur,
                  f.nom AS fournisseur,
                  f.contact AS contact,
                  l.libelle AS article,
                  l.unite AS unite,
                  l.prix_ttc AS prix,
                  l.date_prix AS date_prix,
                  c.libelle AS corps_etat,
                  l.famille AS famille,
                  l.categorie AS categorie
                FROM bareme_lignes_prix l
                LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
                LEFT JOIN bareme_corps_etat c ON c.id = l.corps_etat_id
                WHERE l.parent_id IS NULL
                  AND l.type = 'MATERIAU'
                  AND l.prix_estime = b'0'
                  AND l.libelle IS NOT NULL
                  AND TRIM(l.libelle) <> ''
                  AND f.nom IS NOT NULL
                  AND TRIM(f.nom) <> ''
                  AND l.prix_ttc IS NOT NULL
                ORDER BY c.ordre_affichage, l.libelle, f.nom
                """
            )
            rows = cur.fetchall()

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "BASE DE DONNE F"
        headers = [
            "ref_reception",
            "code_fournisseur",
            "fournisseur",
            "contact",
            "article",
            "unite",
            "prix",
            "date_prix",
            "corps_etat",
            "famille",
            "categorie",
        ]
        ws.append(headers)
        for r in rows:
            ws.append([r.get(h) for h in headers])
        wb.save(OUT_PATH)
        print(f"OK: {len(rows)} lignes exportees vers {OUT_PATH}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
