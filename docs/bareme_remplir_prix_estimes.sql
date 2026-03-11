-- Remplacer les prix à 0 par des montants réalistes (vraies sommes d'argent) et marquer comme estimés.
-- La colonne prix_estime est créée par Hibernate au premier démarrage du backend (ddl-auto: update).
-- Si vous exécutez ce script sans avoir démarré le backend, ajoutez d'abord la colonne :
--   ALTER TABLE bareme_lignes_prix ADD COLUMN prix_estime TINYINT(1) NOT NULL DEFAULT 0;
-- Exécution : Get-Content docs\bareme_remplir_prix_estimes.sql -Encoding UTF8 -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p mika_services_dev --default-character-set=utf8mb4

-- 1) Matériaux avec prix TTC = 0 : remplacer par un montant réaliste (5000 à 55000 XAF) et marquer estimé
UPDATE bareme_lignes_prix
SET
  prix_ttc = 5000 + (id % 25) * 2000,
  prix_estime = 1
WHERE type = 'MATERIAU' AND (prix_ttc = 0 OR prix_ttc IS NULL);

-- 2) Lignes de décomposition prestation (quantité, P.U, somme = 0) : montants cohérents
UPDATE bareme_lignes_prix
SET
  quantite = 1 + (id % 5),
  prix_unitaire = 5000 + (id % 30) * 500,
  somme = (1 + (id % 5)) * (5000 + (id % 30) * 500),
  prix_estime = 1
WHERE type = 'PRESTATION_LIGNE' AND (somme = 0 OR somme IS NULL OR quantite = 0 OR quantite IS NULL);

-- 3) Lignes total prestation (déboursé, P.V = 0) : montants réalistes
UPDATE bareme_lignes_prix
SET
  debourse = 50000 + (id % 50) * 2500,
  prix_vente = ROUND((50000 + (id % 50) * 2500) * 1.25, 2),
  prix_estime = 1
WHERE type = 'PRESTATION_TOTAL' AND (debourse = 0 OR debourse IS NULL);

-- 4) Marquer les entêtes de prestation dont la ligne total est estimée (pour affichage liste)
UPDATE bareme_lignes_prix e
JOIN bareme_lignes_prix t ON t.parent_id = e.id AND t.type = 'PRESTATION_TOTAL' AND t.prix_estime = 1
SET e.prix_estime = 1
WHERE e.type = 'PRESTATION_ENTETE';
