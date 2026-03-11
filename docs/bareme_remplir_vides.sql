-- Remplissage des champs vides/NULL dans bareme_lignes_prix (cohérent avec l'import Excel).
-- Fournisseur par défaut : id 1223 (Non renseigné). Ne modifie que les champs actuellement NULL ou vides.
-- Exécution : Get-Content docs\bareme_remplir_vides.sql -Encoding UTF8 -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p mika_services_dev --default-character-set=utf8mb4

SET NAMES utf8mb4;

-- 1) Référence (texte)
UPDATE bareme_lignes_prix SET reference = '—' WHERE reference IS NULL OR TRIM(COALESCE(reference, '')) = '';

-- 2) Unité
UPDATE bareme_lignes_prix SET unite = 'u' WHERE unite IS NULL OR TRIM(COALESCE(unite, '')) = '';

-- 3) Date prix (texte)
UPDATE bareme_lignes_prix SET date_prix = '—' WHERE date_prix IS NULL OR TRIM(COALESCE(date_prix, '')) = '';

-- 4) Fournisseur (id 1223 = Non renseigné)
UPDATE bareme_lignes_prix SET fournisseur_bareme_id = 1223 WHERE fournisseur_bareme_id IS NULL;

-- 5) Contact texte
UPDATE bareme_lignes_prix SET contact_texte = '—' WHERE contact_texte IS NULL OR TRIM(COALESCE(contact_texte, '')) = '';

-- 6) Unité prestation
UPDATE bareme_lignes_prix SET unite_prestation = 'u' WHERE unite_prestation IS NULL OR TRIM(COALESCE(unite_prestation, '')) = '';

-- 7) Prix TTC (numérique)
UPDATE bareme_lignes_prix SET prix_ttc = 0 WHERE prix_ttc IS NULL;

-- 8) Déboursé, prix vente, somme, quantité, prix unitaire (numériques)
UPDATE bareme_lignes_prix SET debourse = 0 WHERE debourse IS NULL;
UPDATE bareme_lignes_prix SET prix_vente = 0 WHERE prix_vente IS NULL;
UPDATE bareme_lignes_prix SET somme = 0 WHERE somme IS NULL;
UPDATE bareme_lignes_prix SET quantite = 0 WHERE quantite IS NULL;
UPDATE bareme_lignes_prix SET prix_unitaire = 0 WHERE prix_unitaire IS NULL;

-- 9) Coefficient P.V
UPDATE bareme_lignes_prix SET coefficient_pv = 1 WHERE coefficient_pv IS NULL;

-- 10) Libellé vide (au cas où)
UPDATE bareme_lignes_prix SET libelle = '—' WHERE libelle IS NULL OR TRIM(COALESCE(libelle, '')) = '';
