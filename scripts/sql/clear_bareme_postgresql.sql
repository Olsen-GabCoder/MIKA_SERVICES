-- Vide toutes les données du module « barème bâtiment » (PostgreSQL).
-- Ordre : enfants d'abord (FK vers corps d'état et fournisseurs).

BEGIN;

TRUNCATE TABLE bareme_lignes_prix RESTART IDENTITY;
TRUNCATE TABLE bareme_fournisseurs RESTART IDENTITY;
TRUNCATE TABLE bareme_corps_etat RESTART IDENTITY;

COMMIT;
