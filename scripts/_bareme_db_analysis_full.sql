-- Analyse complète barème (toutes les données) — exécution locale

SELECT '========== 1. VOLUMETRIE GLOBALE ==========' AS info;
SELECT type, COUNT(*) AS nb_lignes,
       SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) AS racines,
       SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) AS enfants
FROM bareme_lignes_prix
GROUP BY type
ORDER BY nb_lignes DESC;

SELECT '========== 2. MATÉRIAUX RACINE : UNIVERS ==========' AS info;
SELECT COUNT(*) AS total_lignes_materiau_racine
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT COUNT(DISTINCT CONCAT(IFNULL(corps_etat_id,''), '|', IFNULL(libelle,''), '|', IFNULL(unite,''))) AS nb_couples_libelle_unite_corps
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT COUNT(DISTINCT CONCAT(IFNULL(corps_etat_id,''), '|', IFNULL(libelle,''), '|', IFNULL(reference,''), '|', IFNULL(unite,'')))
  AS nb_groupes_comparaison_actuelle
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT COUNT(DISTINCT fournisseur_bareme_id) AS fournisseurs_ayant_au_moins_une_ligne
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU' AND fournisseur_bareme_id IS NOT NULL;

SELECT '========== 3. ÉCART CLEF MÉTIER vs LOGIQUE ACTUELLE ==========' AS info;
SELECT
  (SELECT COUNT(DISTINCT CONCAT(IFNULL(corps_etat_id,''), '|', IFNULL(libelle,''), '|', IFNULL(unite,'')))
   FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU') AS articles_metier_libelle_unite,
  (SELECT COUNT(DISTINCT CONCAT(IFNULL(corps_etat_id,''), '|', IFNULL(libelle,''), '|', IFNULL(reference,''), '|', IFNULL(unite,'')))
   FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU') AS groupes_api_avec_reference,
  (SELECT COUNT(*) FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU') AS lignes_totales;

SELECT '========== 4. RÉFÉRENCES (reference) ==========' AS info;
SELECT
  SUM(CASE WHEN reference IS NULL OR TRIM(reference) = '' THEN 1 ELSE 0 END) AS lignes_sans_reference,
  SUM(CASE WHEN reference LIKE 'MAT-%' THEN 1 ELSE 0 END) AS lignes_ref_like_MAT,
  SUM(CASE WHEN reference IS NOT NULL AND TRIM(reference) <> '' AND reference NOT LIKE 'MAT-%' THEN 1 ELSE 0 END) AS lignes_autre_format_ref
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT '========== 5. QUALITÉ PRIX / FOURNISSEUR (MATÉRIAUX RACINE) ==========' AS info;
SELECT
  SUM(CASE WHEN fournisseur_bareme_id IS NULL THEN 1 ELSE 0 END) AS sans_fournisseur_id,
  SUM(CASE WHEN prix_ttc IS NULL THEN 1 ELSE 0 END) AS prix_ttc_null,
  SUM(CASE WHEN prix_ttc = 0 THEN 1 ELSE 0 END) AS prix_ttc_zero
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT '========== 6. DOUBLON STRICT (meme groupe + meme fournisseur) ==========' AS info;
SELECT l.corps_etat_id, LEFT(l.libelle, 40) AS lib40, LEFT(COALESCE(l.reference,''), 18) AS ref18, l.unite, f.nom, COUNT(*) AS cnt
FROM bareme_lignes_prix l
JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
GROUP BY l.corps_etat_id, l.libelle, l.reference, l.unite, f.id, f.nom
HAVING COUNT(*) > 1
ORDER BY cnt DESC
LIMIT 30;

SELECT '========== 7. DISTRIBUTION : nb refs distinctes par (corps, libellé, unité) ==========' AS info;
SELECT bucket, COUNT(*) AS nb_articles_libelle_unite
FROM (
  SELECT
    CASE
      WHEN c = 1 THEN '1 ref'
      WHEN c BETWEEN 2 AND 5 THEN '2-5 refs'
      WHEN c BETWEEN 6 AND 20 THEN '6-20 refs'
      WHEN c BETWEEN 21 AND 100 THEN '21-100 refs'
      ELSE '100+ refs'
    END AS bucket
  FROM (
    SELECT COUNT(DISTINCT COALESCE(reference, '')) AS c
    FROM bareme_lignes_prix l
    WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
    GROUP BY l.corps_etat_id, l.libelle, l.unite
  ) t
) x
GROUP BY bucket
ORDER BY FIELD(bucket, '1 ref', '2-5 refs', '6-20 refs', '21-100 refs', '100+ refs');

SELECT '========== 8. TOP 40 libellés : plus de références distinctes (fragmentation) ==========' AS info;
SELECT LEFT(l.libelle, 52) AS lib52, l.unite,
       COUNT(DISTINCT COALESCE(l.reference, '')) AS nb_refs,
       COUNT(*) AS nb_lignes,
       COUNT(DISTINCT l.fournisseur_bareme_id) AS nb_fournisseurs
FROM bareme_lignes_prix l
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
GROUP BY l.corps_etat_id, l.libelle, l.unite
ORDER BY nb_refs DESC
LIMIT 40;

SELECT '========== 9. FOURNISSEURS : lignes par fournisseur (TOP 25) ==========' AS info;
SELECT f.id, LEFT(f.nom, 42) AS nom42, COUNT(*) AS nb_lignes_materiau
FROM bareme_lignes_prix l
JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
GROUP BY f.id, f.nom
ORDER BY nb_lignes_materiau DESC
LIMIT 25;

SELECT '========== 10. FAMILLE / CATÉGORIE (remplissage) ==========' AS info;
SELECT
  SUM(CASE WHEN famille IS NULL OR TRIM(famille) = '' THEN 1 ELSE 0 END) AS sans_famille,
  SUM(CASE WHEN categorie IS NULL OR TRIM(categorie) = '' THEN 1 ELSE 0 END) AS sans_categorie,
  COUNT(*) AS total
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT '========== 11. DÉPÔT (remplissage) ==========' AS info;
SELECT
  SUM(CASE WHEN depot IS NULL OR TRIM(depot) = '' THEN 1 ELSE 0 END) AS sans_depot,
  COUNT(*) AS total
FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';

SELECT '========== 12. PRESTATIONS (si présentes) ==========' AS info;
SELECT type, COUNT(*) AS n FROM bareme_lignes_prix WHERE type <> 'MATERIAU' GROUP BY type;

SELECT '========== 13. NOMS FOURNISSEURS : risque doublons orthographiques (aperçu) ==========' AS info;
SELECT LOWER(TRIM(nom)) AS cle_norm, COUNT(*) AS nb_entrees, GROUP_CONCAT(LEFT(nom, 35) ORDER BY nom SEPARATOR ' | ') AS variantes
FROM bareme_fournisseurs
GROUP BY LOWER(TRIM(nom))
HAVING COUNT(*) > 1
LIMIT 20;
