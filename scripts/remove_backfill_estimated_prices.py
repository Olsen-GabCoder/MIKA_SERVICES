#!/usr/bin/env python3
"""
Supprime les effets du script backfill_estimated_prices.py sur bareme_lignes_prix.

Le backfill marque les lignes avec date_prix = 'ESTIME AUTO' et prix_estime = true
(INSERT ou UPDATE sur lignes MATERIAU racines, parent_id IS NULL).

Ce script remet :
  prix_ttc = NULL, prix_estime = false, date_prix = NULL

pour ces lignes uniquement (ne touche pas aux prix estimés saisis manuellement avec une
autre date que « ESTIME AUTO »).

Bases supportées : MySQL (pymysql) et PostgreSQL (psycopg2), selon DATABASE_URL dans backend/.env.

Usage:
  python scripts/remove_backfill_estimated_prices.py
  python scripts/remove_backfill_estimated_prices.py --execute
"""
from __future__ import annotations

import argparse
import os
from urllib.parse import urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(ROOT, "backend", ".env")


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
    db = (parsed.path or "/").lstrip("/").split("?")[0]
    if not db:
        raise ValueError("Base MySQL absente dans DATABASE_URL")
    return host, port, db


def parse_postgres_url(url: str) -> tuple[str, int, str, str, str]:
    """Retourne host, port, dbname, user, password depuis jdbc:postgresql:// ou postgresql://."""
    u = url.strip()
    if u.startswith("jdbc:postgresql://"):
        u = "postgresql://" + u[len("jdbc:postgresql://") :]
    if not u.startswith("postgresql://"):
        raise ValueError(f"URL PostgreSQL invalide: {url}")
    parsed = urlparse(u)
    host = parsed.hostname or "localhost"
    port = int(parsed.port or 5432)
    db = (parsed.path or "/").lstrip("/").split("?")[0]
    if not db:
        raise ValueError("Base absente dans DATABASE_URL PostgreSQL")
    user = parsed.username or ""
    password = parsed.password or ""
    return host, port, db, user, password


def run_mysql(host: str, port: int, db: str, user: str, password: str, execute: bool) -> int:
    import pymysql

    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=db,
        charset="utf8mb4",
        autocommit=False,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND prix_estime = 1
                  AND LOWER(TRIM(COALESCE(date_prix, ''))) = 'estime auto'
                """
            )
            n = cur.fetchone()[0]
            print(f"Lignes MATERIAU (racine) à réinitialiser (date_prix = ESTIME AUTO) : {n}")
            cur.execute(
                """
                SELECT COUNT(*) FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND prix_estime = 1
                  AND LOWER(TRIM(COALESCE(date_prix, ''))) <> 'estime auto'
                """
            )
            n2 = cur.fetchone()[0]
            if n2:
                print(
                    f"Attention : {n2} ligne(s) MATERIAU avec prix_estime=1 mais date_prix <> 'ESTIME AUTO' "
                    "(ex. backfill qui a conservé une date existante via COALESCE). Elles ne sont pas modifiées par défaut."
                )
            if not execute:
                print("Mode dry-run : aucune écriture. Utilisez --execute pour appliquer.")
                conn.rollback()
                return n
            cur.execute(
                """
                UPDATE bareme_lignes_prix
                SET prix_ttc = NULL,
                    prix_estime = 0,
                    date_prix = NULL,
                    updated_at = NOW(6)
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND prix_estime = 1
                  AND LOWER(TRIM(COALESCE(date_prix, ''))) = 'estime auto'
                """
            )
            affected = cur.rowcount
            conn.commit()
            print(f"OK : {affected} ligne(s) réinitialisée(s).")
            return affected
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def run_postgres(host: str, port: int, db: str, user: str, password: str, execute: bool) -> int:
    import psycopg2

    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=db,
        user=user,
        password=password,
    )
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND prix_estime IS TRUE
                  AND LOWER(TRIM(COALESCE(date_prix::text, ''))) = 'estime auto'
                """
            )
            n = cur.fetchone()[0]
            print(f"Lignes MATERIAU (racine) à réinitialiser (date_prix = ESTIME AUTO) : {n}")
            cur.execute(
                """
                SELECT COUNT(*) FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND prix_estime IS TRUE
                  AND LOWER(TRIM(COALESCE(date_prix::text, ''))) <> 'estime auto'
                """
            )
            n2 = cur.fetchone()[0]
            if n2:
                print(
                    f"Attention : {n2} ligne(s) MATERIAU avec prix_estime=1 mais date_prix <> 'ESTIME AUTO' "
                    "(ex. backfill qui a conservé une date existante via COALESCE). Elles ne sont pas modifiées par défaut."
                )
            if not execute:
                print("Mode dry-run : aucune écriture. Utilisez --execute pour appliquer.")
                conn.rollback()
                return n
            cur.execute(
                """
                UPDATE bareme_lignes_prix
                SET prix_ttc = NULL,
                    prix_estime = FALSE,
                    date_prix = NULL,
                    updated_at = NOW()
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND prix_estime IS TRUE
                  AND LOWER(TRIM(COALESCE(date_prix::text, ''))) = 'estime auto'
                """
            )
            affected = cur.rowcount
            conn.commit()
            print(f"OK : {affected} ligne(s) réinitialisée(s).")
            return affected
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true", help="Appliquer la mise à jour en base")
    args = ap.parse_args()

    env = load_env(ENV_PATH)
    db_url = env.get("DATABASE_URL", "")
    db_user = env.get("DATABASE_USERNAME", "root")
    db_pass = env.get("DATABASE_PASSWORD", "")
    if not db_url:
        raise RuntimeError("DATABASE_URL manquant dans backend/.env")

    url_lower = db_url.lower()
    if "mysql" in url_lower or db_url.startswith("jdbc:mysql"):
        host, port, db_name = parse_mysql_jdbc(db_url)
        run_mysql(host, port, db_name, db_user, db_pass, args.execute)
    elif "postgresql" in url_lower or "postgres" in url_lower:
        host, port, db_name, p_user, p_pass = parse_postgres_url(db_url)
        user = p_user or db_user
        password = p_pass or db_pass
        run_postgres(host, port, db_name, user, password, args.execute)
    else:
        raise RuntimeError(
            "DATABASE_URL non reconnu (attendu : jdbc:mysql://... ou postgresql:// / jdbc:postgresql://...)"
        )


if __name__ == "__main__":
    main()
