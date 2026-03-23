#!/usr/bin/env python3
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
    "bareme_coefficients_eloignement",
    "bareme_corps_etat",
    "bareme_fournisseurs",
    "bareme_lignes_prix",
]


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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target-pg-url", required=True, help="URL PostgreSQL cible")
    ap.add_argument("--execute", action="store_true", help="Appliquer la migration")
    args = ap.parse_args()
    dry_run = not args.execute

    env = load_env(ENV_PATH)
    mysql_url = env.get("DATABASE_URL", "")
    mysql_user = env.get("DATABASE_USERNAME", "root")
    mysql_pass = env.get("DATABASE_PASSWORD", "")
    if not mysql_url:
        raise RuntimeError("DATABASE_URL manquant dans backend/.env")

    mysql_host, mysql_port, mysql_db = parse_mysql_jdbc(mysql_url)

    mysql_conn = pymysql.connect(
        host=mysql_host,
        port=mysql_port,
        user=mysql_user,
        password=mysql_pass,
        database=mysql_db,
        charset="utf8mb4",
    )
    pg_conn = psycopg2.connect(args.target_pg_url)
    pg_conn.autocommit = False

    try:
        with mysql_conn.cursor() as mcur, pg_conn.cursor() as pcur:
            # Pré-lecture des données MySQL
            data: dict[str, tuple[list[str], list[tuple[Any, ...]]]] = {}
            counts: dict[str, int] = {}
            for t in TABLES:
                cols, rows = mysql_rows(mcur, t)
                data[t] = (cols, rows)
                counts[t] = len(rows)

            print("=== Comptes source MySQL ===")
            for t in TABLES:
                print(f"{t}: {counts[t]}")

            if dry_run:
                print("\nMode dry-run: aucune écriture cible.")
                return

            # Purge cible (ordre FK)
            pcur.execute("TRUNCATE TABLE bareme_lignes_prix RESTART IDENTITY CASCADE")
            pcur.execute("TRUNCATE TABLE bareme_fournisseurs RESTART IDENTITY CASCADE")
            pcur.execute("TRUNCATE TABLE bareme_corps_etat RESTART IDENTITY CASCADE")
            pcur.execute("TRUNCATE TABLE bareme_coefficients_eloignement RESTART IDENTITY CASCADE")

            # Insert ordre parent -> enfant
            insert_order = [
                "bareme_coefficients_eloignement",
                "bareme_corps_etat",
                "bareme_fournisseurs",
                "bareme_lignes_prix",
            ]
            for t in insert_order:
                cols, rows = data[t]
                if not rows:
                    continue
                col_sql = ", ".join(cols)
                placeholders = ", ".join(["%s"] * len(cols))
                sql = f"INSERT INTO {t} ({col_sql}) VALUES ({placeholders})"
                psycopg2.extras.execute_batch(pcur, sql, rows, page_size=2000)
                print(f"inséré {len(rows)} lignes -> {t}")

            # Recalage des séquences sur max(id)
            pcur.execute("SELECT setval('bareme_coefficients_eloignement_id_seq', COALESCE((SELECT MAX(id) FROM bareme_coefficients_eloignement), 1), true)")
            pcur.execute("SELECT setval('bareme_corps_etat_id_seq', COALESCE((SELECT MAX(id) FROM bareme_corps_etat), 1), true)")
            pcur.execute("SELECT setval('bareme_fournisseurs_id_seq', COALESCE((SELECT MAX(id) FROM bareme_fournisseurs), 1), true)")
            pcur.execute("SELECT setval('bareme_lignes_prix_id_seq', COALESCE((SELECT MAX(id) FROM bareme_lignes_prix), 1), true)")

            pg_conn.commit()
            print("\nOK: migration bareme locale -> postgres prod terminée.")
    except Exception:
        pg_conn.rollback()
        raise
    finally:
        mysql_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
