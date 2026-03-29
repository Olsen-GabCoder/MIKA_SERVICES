#!/usr/bin/env python3
"""
Copie les données barème MySQL (local, backend/.env) vers PostgreSQL (ex. Render).

Tables : bareme_corps_etat, bareme_fournisseurs, bareme_lignes_prix, bareme_mat_ref_sequence.

URL cible : argument --target-pg-url, ou variable RENDER_PG_URL dans backend/.env.

Usage :
  python scripts/transfer_bareme_mysql_to_postgres.py
  python scripts/transfer_bareme_mysql_to_postgres.py --execute

Dépendances : pip install pymysql psycopg2-binary
"""
from __future__ import annotations

import argparse
import os
from typing import Any
from urllib.parse import urlparse

import pymysql
import psycopg2
import psycopg2.extras


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(ROOT, "backend", ".env")

TABLES = [
    "bareme_corps_etat",
    "bareme_fournisseurs",
    "bareme_lignes_prix",
    "bareme_mat_ref_sequence",
]

# Schéma aligné sur l'entité JPA BaremeMatRefSequence (bases Render créées avant cette table)
CREATE_MAT_REF_SEQ_IF_MISSING = """
CREATE TABLE IF NOT EXISTS bareme_mat_ref_sequence (
    annee INTEGER NOT NULL PRIMARY KEY,
    dernier_numero INTEGER NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0
);
"""

# Schémas Render anciens : colonne attendue par JPA (facettes dépôt)
ENSURE_LIGNES_DEPOT_COLUMN = """
ALTER TABLE bareme_lignes_prix ADD COLUMN IF NOT EXISTS depot VARCHAR(20);
"""


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


def assert_valid_postgres_url(url: str) -> str:
    u = url.strip()
    if u.startswith("://"):
        raise SystemExit(
            "URL PostgreSQL invalide : commence par '://' (manque 'postgresql').\n"
            "PowerShell : ne pas utiliser $env:postgresql://... Utiliser RENDER_PG_URL dans .env ou "
            '--target-pg-url "postgresql://..."'
        )
    if not (u.startswith("postgresql://") or u.startswith("postgres://")):
        raise SystemExit(f'URL doit commencer par postgresql:// (reçu : "{u[:48]}...")')
    return u


def parse_mysql_jdbc(url: str) -> tuple[str, int, str]:
    if not url.startswith("jdbc:mysql://"):
        raise ValueError(f"URL JDBC MySQL invalide: {url}")
    parsed = urlparse(url.replace("jdbc:", "", 1))
    host = parsed.hostname or "localhost"
    port = int(parsed.port or 3306)
    db = (parsed.path or "/").lstrip("/")
    if not db:
        raise ValueError("Base MySQL absente dans DATABASE_URL")
    return host, port, db


def mysql_rows(cur: pymysql.cursors.Cursor, table: str) -> tuple[list[str], list[tuple[Any, ...]]]:
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    return cols, rows


def pg_table_columns_and_types(pcur, table: str) -> tuple[list[str], dict[str, str]]:
    pcur.execute(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position
        """,
        (table,),
    )
    rows = pcur.fetchall()
    names = [r[0] for r in rows]
    types = {r[0]: (r[1] or "").lower() for r in rows}
    return names, types


def coerce_value_for_pg(pg_data_type: str, val: Any) -> Any:
    """MySQL (pymysql) peut renvoyer BIT/bool en bytes ; PostgreSQL attend un vrai bool."""
    if val is None:
        return None
    t = (pg_data_type or "").lower()
    if t == "boolean":
        if isinstance(val, bool):
            return val
        if isinstance(val, (bytes, bytearray, memoryview)):
            b = bytes(val)
            if len(b) == 0:
                return False
            return any(x != 0 for x in b)
        if isinstance(val, int):
            return val != 0
        if isinstance(val, str):
            s = val.strip().lower()
            return s in ("1", "true", "t", "yes", "y", "on")
    return val


def coerce_aligned_row(insert_cols: list[str], row: tuple[Any, ...], pg_types: dict[str, str]) -> tuple[Any, ...]:
    return tuple(coerce_value_for_pg(pg_types.get(c, ""), v) for c, v in zip(insert_cols, row, strict=True))


def align_rows_to_pg_columns(
    mysql_cols: list[str],
    mysql_rows: list[tuple[Any, ...]],
    pg_cols: list[str],
) -> tuple[list[str], list[tuple[Any, ...]], list[str], list[str]]:
    """
    Colonnes d'INSERT = intersection, ordre PostgreSQL.
    Ignore les colonnes MySQL seules (ex. ville) ; les colonnes PG seules restent aux défauts / NULL.
    """
    mysql_idx = {c: i for i, c in enumerate(mysql_cols)}
    insert_cols = [c for c in pg_cols if c in mysql_idx]
    skipped_mysql = [c for c in mysql_cols if c not in pg_cols]
    skipped_pg = [c for c in pg_cols if c not in mysql_idx]
    aligned = [tuple(row[mysql_idx[c]] for c in insert_cols) for row in mysql_rows]
    return insert_cols, aligned, skipped_mysql, skipped_pg


def main() -> None:
    ap = argparse.ArgumentParser(description="Barème MySQL -> PostgreSQL")
    ap.add_argument(
        "--target-pg-url",
        default="",
        help="URL libpq (sinon RENDER_PG_URL ou TARGET_PG_URL dans backend/.env)",
    )
    ap.add_argument("--execute", action="store_true", help="Écrire sur PostgreSQL (sinon dry-run)")
    args = ap.parse_args()
    dry_run = not args.execute

    env = load_env(ENV_PATH)
    mysql_url = env.get("DATABASE_URL", "")
    mysql_user = env.get("DATABASE_USERNAME", "root")
    mysql_pass = env.get("DATABASE_PASSWORD", "")
    if not mysql_url:
        raise RuntimeError("DATABASE_URL manquant dans backend/.env")

    pg_raw = (args.target_pg_url or "").strip() or env.get("RENDER_PG_URL") or env.get("TARGET_PG_URL") or ""
    if not pg_raw:
        raise SystemExit(
            "URL PostgreSQL manquante : ajoutez RENDER_PG_URL dans backend/.env ou passez --target-pg-url \"postgresql://...\""
        )
    pg_url = assert_valid_postgres_url(pg_raw)

    mysql_host, mysql_port, mysql_db = parse_mysql_jdbc(mysql_url)

    mysql_conn = pymysql.connect(
        host=mysql_host,
        port=mysql_port,
        user=mysql_user,
        password=mysql_pass,
        database=mysql_db,
        charset="utf8mb4",
    )
    pg_conn = psycopg2.connect(pg_url)
    pg_conn.autocommit = False

    try:
        with mysql_conn.cursor() as mcur, pg_conn.cursor() as pcur:
            data: dict[str, tuple[list[str], list[tuple[Any, ...]]]] = {}
            counts: dict[str, int] = {}
            for t in TABLES:
                cols, rows = mysql_rows(mcur, t)
                data[t] = (cols, rows)
                counts[t] = len(rows)

            print("=== Comptes source MySQL ===")
            for t in TABLES:
                print(f"  {t}: {counts[t]}")

            if dry_run:
                print("\nMode dry-run: aucune écriture cible. Relancer avec --execute pour appliquer.")
                return

            pcur.execute(CREATE_MAT_REF_SEQ_IF_MISSING)
            print("bareme_mat_ref_sequence : table créée si absente (Render / ancien schéma).")

            pcur.execute(ENSURE_LIGNES_DEPOT_COLUMN)
            print("bareme_lignes_prix.depot : colonne ajoutée si absente.")

            pcur.execute(
                """
                TRUNCATE TABLE
                    bareme_lignes_prix,
                    bareme_fournisseurs,
                    bareme_corps_etat,
                    bareme_mat_ref_sequence
                RESTART IDENTITY CASCADE
                """
            )

            pg_meta_by_table: dict[str, tuple[list[str], dict[str, str]]] = {
                t: pg_table_columns_and_types(pcur, t) for t in TABLES
            }

            for t in TABLES:
                cols, rows = data[t]
                if not rows:
                    continue
                pg_cols, pg_types = pg_meta_by_table[t]
                insert_cols, aligned_rows, skip_m, skip_p = align_rows_to_pg_columns(cols, rows, pg_cols)
                if not insert_cols:
                    raise RuntimeError(f"{t}: aucune colonne commune MySQL / PostgreSQL")
                if skip_m:
                    print(f"  {t}: colonnes MySQL ignorées (absentes en PG) : {', '.join(skip_m)}")
                if skip_p:
                    print(f"  {t}: colonnes PG non remplies depuis MySQL : {', '.join(skip_p)}")
                coerced_rows = [coerce_aligned_row(insert_cols, r, pg_types) for r in aligned_rows]
                col_sql = ", ".join(insert_cols)
                placeholders = ", ".join(["%s"] * len(insert_cols))
                sql = f"INSERT INTO {t} ({col_sql}) VALUES ({placeholders})"
                psycopg2.extras.execute_batch(pcur, sql, coerced_rows, page_size=2000)
                print(f"inséré {len(rows)} lignes -> {t}")

            pcur.execute(
                "SELECT setval('bareme_corps_etat_id_seq', COALESCE((SELECT MAX(id) FROM bareme_corps_etat), 1), true)"
            )
            pcur.execute(
                "SELECT setval('bareme_fournisseurs_id_seq', COALESCE((SELECT MAX(id) FROM bareme_fournisseurs), 1), true)"
            )
            pcur.execute(
                "SELECT setval('bareme_lignes_prix_id_seq', COALESCE((SELECT MAX(id) FROM bareme_lignes_prix), 1), true)"
            )

            pg_conn.commit()
            print("\nOK: migration barème MySQL -> PostgreSQL terminée.")
    except Exception:
        pg_conn.rollback()
        raise
    finally:
        mysql_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
