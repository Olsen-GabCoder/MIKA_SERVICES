-- Analyse barème (exécution locale)
SELECT '--- counts ---' AS section;
SELECT 'lignes_materiau_racine' AS k, COUNT(*) AS v FROM bareme_lignes_prix WHERE parent_id IS NULL AND type = 'MATERIAU';
SELECT 'fournisseurs' AS k, COUNT(*) AS v FROM bareme_fournisseurs;
SELECT 'corps_etat' AS k, COUNT(*) AS v FROM bareme_corps_etat;

SELECT '--- meme libelle+unite+corps, plusieurs references ---' AS section;
SELECT l.corps_etat_id, LEFT(l.libelle, 60) AS lib60, l.unite,
       COUNT(DISTINCT COALESCE(l.reference, '')) AS nb_refs_distinctes,
       COUNT(*) AS nb_lignes
FROM bareme_lignes_prix l
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
GROUP BY l.corps_etat_id, l.libelle, l.unite
HAVING COUNT(DISTINCT COALESCE(l.reference, '')) > 1
ORDER BY nb_lignes DESC
LIMIT 25;

SELECT '--- meme groupe (corps+libelle+ref+unite), meme fournisseur >1 ligne ---' AS section;
SELECT l.corps_etat_id, LEFT(l.libelle, 50) AS lib50, LEFT(COALESCE(l.reference,'(NULL)'), 20) AS ref20, l.unite, f.nom AS fournisseur, COUNT(*) AS cnt
FROM bareme_lignes_prix l
JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
GROUP BY l.corps_etat_id, l.libelle, l.reference, l.unite, f.id, f.nom
HAVING COUNT(*) > 1
ORDER BY cnt DESC
LIMIT 25;

SELECT '--- top libelles les plus dupliques (nb groupes distincts par ref) ---' AS section;
SELECT LEFT(l.libelle, 55) AS lib55, l.unite, COUNT(*) AS nb_lignes,
       COUNT(DISTINCT CONCAT(IFNULL(l.reference,''), '|', l.corps_etat_id)) AS nb_groupes_cles
FROM bareme_lignes_prix l
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
GROUP BY l.libelle, l.unite
HAVING COUNT(DISTINCT CONCAT(IFNULL(l.reference,''), '|', l.corps_etat_id)) > 1
ORDER BY nb_groupes_cles DESC
LIMIT 20;

SELECT '--- echantillon ACIER / acier ---' AS section;
SELECT l.id, LEFT(l.libelle, 45) AS lib45, LEFT(COALESCE(l.reference,'NULL'), 25) AS ref, l.unite, LEFT(f.nom, 30) AS fourn, l.prix_ttc
FROM bareme_lignes_prix l
LEFT JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
WHERE l.parent_id IS NULL AND l.type = 'MATERIAU'
  AND (l.libelle LIKE '%ACIER%' OR l.libelle LIKE '%acier%')
ORDER BY l.libelle, l.reference, f.nom
LIMIT 40;
