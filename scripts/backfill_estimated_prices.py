#!/usr/bin/env python3
"""
Backfill des prix estimés dans bareme_lignes_prix (MATERIAU, parent NULL).

Objectif:
- Remplacer les "trous" de prix dans le tableau de comparaison par des valeurs estimées
  stockées en base (pas de fabrication frontend).

Règles:
- Estimation = médiane des prix réels disponibles pour un article donné
  (clé article: corps_etat_id + libelle + reference + unite + famille + categorie).
- Si une ligne existe déjà pour un fournisseur mais prix_ttc est NULL -> UPDATE prix_ttc + prix_estime=1.
- Si aucun enregistrement n'existe pour un fournisseur du corps d'état -> INSERT d'une ligne estimée.
- On ne touche qu'aux lignes MATERIAU racines (parent_id IS NULL).

Usage:
  python scripts/backfill_estimated_prices.py --dry-run
  python scripts/backfill_estimated_prices.py --execute
"""
from __future__ import annotations

import argparse
import os
import statistics
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urlparse

import pymysql


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


def parse_jdbc_url(url: str) -> tuple[str, int, str]:
    # Ex: jdbc:mysql://localhost:3306/mika_services_dev?...
    if not url.startswith("jdbc:mysql://"):
        raise ValueError(f"JDBC URL invalide: {url}")
    parsed = urlparse(url.replace("jdbc:", "", 1))
    host = parsed.hostname or "localhost"
    port = int(parsed.port or 3306)
    db = (parsed.path or "/").lstrip("/")
    if not db:
        raise ValueError(f"Nom de base absent dans JDBC URL: {url}")
    return host, port, db


def dec2(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true", help="Appliquer les changements en base")
    args = ap.parse_args()
    dry_run = not args.execute

    env = load_env(ENV_PATH)
    db_url = env.get("DATABASE_URL", "")
    db_user = env.get("DATABASE_USERNAME", "root")
    db_pass = env.get("DATABASE_PASSWORD", "")
    if not db_url:
        raise RuntimeError("DATABASE_URL manquant dans backend/.env")
    host, port, db_name = parse_jdbc_url(db_url)

    conn = pymysql.connect(
        host=host,
        port=port,
        user=db_user,
        password=db_pass,
        database=db_name,
        charset="utf8mb4",
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor,
    )

    try:
        with conn.cursor() as cur:
            # 1) Univers fournisseurs par corps d'état
            cur.execute(
                """
                SELECT corps_etat_id, fournisseur_bareme_id
                FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                  AND fournisseur_bareme_id IS NOT NULL
                GROUP BY corps_etat_id, fournisseur_bareme_id
                """
            )
            fournisseurs_par_corps: dict[int, set[int]] = {}
            for r in cur.fetchall():
                cid = int(r["corps_etat_id"])
                fid = int(r["fournisseur_bareme_id"])
                fournisseurs_par_corps.setdefault(cid, set()).add(fid)

            # 2) Toutes les lignes matériau racines
            cur.execute(
                """
                SELECT id, corps_etat_id, reference, libelle, unite, famille, categorie,
                       fournisseur_bareme_id, contact_texte, prix_ttc, prix_estime, ordre_ligne
                FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                  AND type = 'MATERIAU'
                ORDER BY corps_etat_id, id
                """
            )
            rows = cur.fetchall()

            # key article = même logique compare + attributs métier conservés
            def key_of(r: dict) -> tuple:
                return (
                    int(r["corps_etat_id"]),
                    (r["libelle"] or "").strip(),
                    (r["reference"] or "").strip(),
                    (r["unite"] or "").strip(),
                    (r["famille"] or "").strip(),
                    (r["categorie"] or "").strip(),
                )

            groups: dict[tuple, list[dict]] = {}
            for r in rows:
                groups.setdefault(key_of(r), []).append(r)

            # max ordre_ligne par corps pour inserts propres
            cur.execute(
                """
                SELECT corps_etat_id, COALESCE(MAX(ordre_ligne), 0) AS max_ordre
                FROM bareme_lignes_prix
                WHERE parent_id IS NULL
                GROUP BY corps_etat_id
                """
            )
            next_ordre: dict[int, int] = {int(r["corps_etat_id"]): int(r["max_ordre"]) for r in cur.fetchall()}

            updates: list[tuple[Decimal, int]] = []
            inserts: list[tuple] = []
            skipped_no_basis = 0

            for k, grp in groups.items():
                corps_id = k[0]
                all_suppliers = fournisseurs_par_corps.get(corps_id, set())
                if not all_suppliers:
                    skipped_no_basis += 1
                    continue

                prices = []
                for r in grp:
                    v = r["prix_ttc"]
                    if v is not None:
                        prices.append(Decimal(str(v)))
                if not prices:
                    # aucun prix de base pour cet article -> impossible d'estimer raisonnablement
                    skipped_no_basis += 1
                    continue

                est = dec2(Decimal(str(statistics.median(prices))))
                by_supplier: dict[int, dict] = {}
                null_price_rows: list[dict] = []
                for r in grp:
                    fid = r["fournisseur_bareme_id"]
                    if fid is None:
                        continue
                    by_supplier[int(fid)] = r
                    if r["prix_ttc"] is None:
                        null_price_rows.append(r)

                # UPDATE lignes existantes sans prix
                for r in null_price_rows:
                    updates.append((est, int(r["id"])))

                # INSERT lignes manquantes fournisseur/article
                template = grp[0]
                missing_suppliers = sorted(all_suppliers.difference(set(by_supplier.keys())))
                for fid in missing_suppliers:
                    next_ordre[corps_id] = next_ordre.get(corps_id, 0) + 1
                    inserts.append(
                        (
                            corps_id,
                            template["reference"],
                            template["libelle"],
                            template["famille"],
                            template["categorie"],
                            template["unite"],
                            est,
                            "ESTIME AUTO",
                            fid,
                            template["contact_texte"],
                            next_ordre[corps_id],
                        )
                    )

            print("=== Backfill prix estimés (MATERIAU) ===")
            print(f"Groupes articles analysés      : {len(groups)}")
            print(f"UPDATE lignes prix NULL        : {len(updates)}")
            print(f"INSERT lignes manquantes       : {len(inserts)}")
            print(f"Groupes sans base d'estimation : {skipped_no_basis}")
            if dry_run:
                print("\nMode dry-run: aucune écriture.")
                conn.rollback()
                return

            if updates:
                cur.executemany(
                    """
                    UPDATE bareme_lignes_prix
                    SET prix_ttc = %s,
                        prix_estime = b'1',
                        date_prix = COALESCE(date_prix, 'ESTIME AUTO'),
                        updated_at = NOW(6)
                    WHERE id = %s
                    """,
                    updates,
                )

            if inserts:
                cur.executemany(
                    """
                    INSERT INTO bareme_lignes_prix (
                        corps_etat_id, type, reference, libelle, famille, categorie, unite,
                        prix_ttc, date_prix, fournisseur_bareme_id, contact_texte,
                        ordre_ligne, parent_id, prix_estime, created_at, updated_at
                    ) VALUES (
                        %s, 'MATERIAU', %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, NULL, b'1', NOW(6), NOW(6)
                    )
                    """,
                    inserts,
                )

            conn.commit()
            print("OK: backfill appliqué en base.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
