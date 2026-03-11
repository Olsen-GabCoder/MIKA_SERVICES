-- Remplir les cellules prix vides en vue recherche : pour chaque article (matériau) et chaque
-- fournisseur du même corps d'état, s'il manque une ligne (article, fournisseur), on en crée une
-- avec un prix estimé (montant réaliste) et prix_estime = 1.
-- À exécuter après bareme_remplir_prix_estimes.sql (ou après avoir la colonne prix_estime).
-- Exécution : Get-Content docs\bareme_remplir_prix_manquants_par_fournisseur.sql -Encoding UTF8 -Raw | & "C:\...\mysql.exe" -u root -p mika_services_dev --default-character-set=utf8mb4

SET NAMES utf8mb4;

-- 0) Rappel : remplir tout prix restant à 0 (prestations) pour éviter "0 FCFA / 0 FCFA"
UPDATE bareme_lignes_prix SET debourse = 50000 + (id % 50) * 2500, prix_vente = ROUND((50000 + (id % 50) * 2500) * 1.25, 2), prix_estime = 1
WHERE type = 'PRESTATION_TOTAL' AND (debourse = 0 OR debourse IS NULL);
UPDATE bareme_lignes_prix SET prix_ttc = 5000 + (id % 25) * 2000, prix_estime = 1
WHERE type = 'MATERIAU' AND (prix_ttc = 0 OR prix_ttc IS NULL);

-- Insertion des lignes MATERIAU manquantes (article + fournisseur) avec prix TTC estimé
INSERT INTO bareme_lignes_prix (
  corps_etat_id,
  type,
  reference,
  libelle,
  unite,
  prix_ttc,
  date_prix,
  fournisseur_bareme_id,
  contact_texte,
  ordre_ligne,
  prix_estime,
  created_at,
  updated_at
)
SELECT
  a.corps_etat_id,
  'MATERIAU',
  COALESCE(a.ref, '—'),
  a.libelle,
  a.unite,
  5000 + (f.fournisseur_id % 25) * 2000,
  '—',
  f.fournisseur_id,
  '—',
  COALESCE(a.max_ordre, 0),
  1,
  NOW(),
  NOW()
FROM (
  SELECT
    corps_etat_id,
    libelle,
    unite,
    reference AS ref,
    MAX(ordre_ligne) AS max_ordre
  FROM bareme_lignes_prix
  WHERE type = 'MATERIAU'
  GROUP BY corps_etat_id, libelle, unite, reference
) a
INNER JOIN (
  SELECT DISTINCT corps_etat_id, fournisseur_bareme_id AS fournisseur_id
  FROM bareme_lignes_prix
  WHERE type = 'MATERIAU' AND fournisseur_bareme_id IS NOT NULL
) f ON f.corps_etat_id = a.corps_etat_id
LEFT JOIN bareme_lignes_prix exist
  ON exist.corps_etat_id = a.corps_etat_id
  AND exist.type = 'MATERIAU'
  AND exist.fournisseur_bareme_id = f.fournisseur_id
  AND (COALESCE(exist.libelle, '') = COALESCE(a.libelle, ''))
  AND (COALESCE(exist.unite, '') = COALESCE(a.unite, ''))
  AND (COALESCE(exist.reference, '') = COALESCE(a.ref, ''))
WHERE exist.id IS NULL;
