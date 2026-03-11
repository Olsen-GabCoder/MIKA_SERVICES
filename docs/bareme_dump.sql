-- ============================================================
-- Interrogation des données barème (toutes les données)
-- Base : celle configurée dans application-dev.yml (ex. mika_services_dev)
-- Exécution : client MySQL (DBeaver, MySQL Workbench, ligne de commande)
--   mysql -u <user> -p <nom_base> < docs/bareme_dump.sql
-- ============================================================

-- ---------- 1) Coefficients d'éloignement (tous) ----------
SELECT '=== Coefficients d''éloignement ===' AS section;
SELECT id, nom, pourcentage, coefficient, note, ordre_affichage
FROM bareme_coefficients_eloignement
ORDER BY ordre_affichage, nom;

-- ---------- 2) Corps d'état (tous) ----------
SELECT '=== Corps d''état ===' AS section;
SELECT id, code, libelle, ordre_affichage
FROM bareme_corps_etat
ORDER BY ordre_affichage;

-- ---------- 3) Fournisseurs (tous) ----------
SELECT '=== Fournisseurs ===' AS section;
SELECT id, nom, contact
FROM bareme_fournisseurs
ORDER BY nom;

-- ---------- 4) Lignes de prix : comptages par type ----------
SELECT '=== Lignes de prix par type ===' AS section;
SELECT type, COUNT(*) AS nb
FROM bareme_lignes_prix
GROUP BY type
ORDER BY type;

-- ---------- 5) Lignes de prix : échantillon (500 premières) ----------
SELECT '=== Échantillon de lignes (id, type, référence, libellé, unité, prix, fournisseur, corps) ===' AS section;
SELECT
  l.id,
  l.type,
  l.reference,
  LEFT(l.libelle, 80) AS libelle,
  l.unite,
  l.prix_ttc,
  l.date_prix,
  f.nom AS fournisseur,
  l.contact_texte,
  l.debourse,
  l.prix_vente,
  l.unite_prestation,
  ce.code AS corps_etat_code,
  l.parent_id
FROM bareme_lignes_prix l
LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
LEFT JOIN bareme_corps_etat ce ON ce.id = l.corps_etat_id
ORDER BY l.id
LIMIT 500;

-- ---------- 6) Lignes par corps d'état ----------
SELECT '=== Nombre de lignes par corps d''état ===' AS section;
SELECT ce.code, ce.libelle, COUNT(l.id) AS nb_lignes
FROM bareme_corps_etat ce
LEFT JOIN bareme_lignes_prix l ON l.corps_etat_id = ce.id
GROUP BY ce.id, ce.code, ce.libelle
ORDER BY ce.ordre_affichage;
