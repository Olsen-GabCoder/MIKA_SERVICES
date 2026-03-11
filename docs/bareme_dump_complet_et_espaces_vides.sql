-- ============================================================
-- BARÈME : TOUT CONNAÎTRE + REPÉRAGE DES ESPACES VIDES
-- Base : mika_services_dev (application-dev.yml)
-- Exécution : MySQL Workbench, DBeaver, ou
--   mysql -u <user> -p mika_services_dev < docs/bareme_dump_complet_et_espaces_vides.sql
-- ============================================================

-- =====================
-- PARTIE 1 : SCHÉMA (colonnes des tables barème)
-- =====================
SELECT '=== 1. STRUCTURE DES TABLES BARÈME ===' AS section;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('bareme_coefficients_eloignement', 'bareme_corps_etat', 'bareme_fournisseurs', 'bareme_lignes_prix')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- =====================
-- PARTIE 2 : COMPTAGES GLOBAUX
-- =====================
SELECT '=== 2. NOMBRE TOTAL D''ENREGISTREMENTS PAR TABLE ===' AS section;
SELECT 'bareme_coefficients_eloignement' AS table_name, COUNT(*) AS total FROM bareme_coefficients_eloignement
UNION ALL SELECT 'bareme_corps_etat', COUNT(*) FROM bareme_corps_etat
UNION ALL SELECT 'bareme_fournisseurs', COUNT(*) FROM bareme_fournisseurs
UNION ALL SELECT 'bareme_lignes_prix', COUNT(*) FROM bareme_lignes_prix;

-- =====================
-- PARTIE 3 : ESPACES VIDES — COEFFICIENTS D'ÉLOIGNEMENT
-- =====================
SELECT '=== 3. COEFFICIENTS — CHAMPS NULL / VIDES / ESPACES SEULS ===' AS section;
SELECT
  COUNT(*) AS total_lignes,
  SUM(CASE WHEN nom IS NULL THEN 1 ELSE 0 END) AS nom_NULL,
  SUM(CASE WHEN nom = '' OR (nom IS NOT NULL AND TRIM(nom) = '') THEN 1 ELSE 0 END) AS nom_vide_ou_espaces,
  SUM(CASE WHEN pourcentage IS NULL THEN 1 ELSE 0 END) AS pourcentage_NULL,
  SUM(CASE WHEN note IS NULL THEN 1 ELSE 0 END) AS note_NULL,
  SUM(CASE WHEN note = '' OR (note IS NOT NULL AND TRIM(note) = '') THEN 1 ELSE 0 END) AS note_vide_ou_espaces,
  SUM(CASE WHEN ordre_affichage IS NULL THEN 1 ELSE 0 END) AS ordre_affichage_NULL
FROM bareme_coefficients_eloignement;

-- Exemples de lignes avec champs vides (coefficients)
SELECT '=== 3b. COEFFICIENTS — Exemples où nom ou note est vide/NULL ===' AS section;
SELECT id, nom, pourcentage, coefficient, LEFT(note, 50) AS note_extrait, ordre_affichage
FROM bareme_coefficients_eloignement
WHERE nom IS NULL OR TRIM(COALESCE(note,'')) = '' OR TRIM(COALESCE(nom,'')) = ''
LIMIT 20;

-- =====================
-- PARTIE 4 : ESPACES VIDES — CORPS D'ÉTAT
-- =====================
SELECT '=== 4. CORPS D''ÉTAT — CHAMPS NULL / VIDES / ESPACES SEULS ===' AS section;
SELECT
  COUNT(*) AS total_lignes,
  SUM(CASE WHEN code IS NULL THEN 1 ELSE 0 END) AS code_NULL,
  SUM(CASE WHEN code = '' OR (code IS NOT NULL AND TRIM(code) = '') THEN 1 ELSE 0 END) AS code_vide_ou_espaces,
  SUM(CASE WHEN libelle IS NULL THEN 1 ELSE 0 END) AS libelle_NULL,
  SUM(CASE WHEN libelle = '' OR (libelle IS NOT NULL AND TRIM(libelle) = '') THEN 1 ELSE 0 END) AS libelle_vide_ou_espaces,
  SUM(CASE WHEN ordre_affichage IS NULL THEN 1 ELSE 0 END) AS ordre_affichage_NULL
FROM bareme_corps_etat;

-- =====================
-- PARTIE 5 : ESPACES VIDES — FOURNISSEURS
-- =====================
SELECT '=== 5. FOURNISSEURS — CHAMPS NULL / VIDES / ESPACES SEULS ===' AS section;
SELECT
  COUNT(*) AS total_lignes,
  SUM(CASE WHEN nom IS NULL THEN 1 ELSE 0 END) AS nom_NULL,
  SUM(CASE WHEN nom = '' OR (nom IS NOT NULL AND TRIM(nom) = '') THEN 1 ELSE 0 END) AS nom_vide_ou_espaces,
  SUM(CASE WHEN contact IS NULL THEN 1 ELSE 0 END) AS contact_NULL,
  SUM(CASE WHEN contact = '' OR (contact IS NOT NULL AND TRIM(contact) = '') THEN 1 ELSE 0 END) AS contact_vide_ou_espaces
FROM bareme_fournisseurs;

-- Exemples fournisseurs avec nom ou contact vide
SELECT '=== 5b. FOURNISSEURS — Exemples nom/contact vide ===' AS section;
SELECT id, nom, contact
FROM bareme_fournisseurs
WHERE nom IS NULL OR TRIM(COALESCE(nom,'')) = '' OR contact IS NULL OR TRIM(COALESCE(contact,'')) = ''
LIMIT 30;

-- =====================
-- PARTIE 6 : ESPACES VIDES — LIGNES DE PRIX (détail par colonne)
-- C'est la table qui alimente directement la liste frontend → espaces vides visibles
-- =====================
SELECT '=== 6. LIGNES DE PRIX — RÉSUMÉ CHAMPS NULL / VIDES (total lignes) ===' AS section;
SELECT
  COUNT(*) AS total_lignes,
  SUM(CASE WHEN reference IS NULL THEN 1 ELSE 0 END) AS reference_NULL,
  SUM(CASE WHEN reference = '' OR (reference IS NOT NULL AND TRIM(reference) = '') THEN 1 ELSE 0 END) AS reference_vide_espaces,
  SUM(CASE WHEN libelle IS NULL THEN 1 ELSE 0 END) AS libelle_NULL,
  SUM(CASE WHEN libelle = '' OR (libelle IS NOT NULL AND TRIM(COALESCE(libelle,'')) = '') THEN 1 ELSE 0 END) AS libelle_vide_espaces,
  SUM(CASE WHEN unite IS NULL THEN 1 ELSE 0 END) AS unite_NULL,
  SUM(CASE WHEN unite = '' OR (unite IS NOT NULL AND TRIM(unite) = '') THEN 1 ELSE 0 END) AS unite_vide_espaces,
  SUM(CASE WHEN prix_ttc IS NULL THEN 1 ELSE 0 END) AS prix_ttc_NULL,
  SUM(CASE WHEN date_prix IS NULL THEN 1 ELSE 0 END) AS date_prix_NULL,
  SUM(CASE WHEN date_prix = '' OR (date_prix IS NOT NULL AND TRIM(date_prix) = '') THEN 1 ELSE 0 END) AS date_prix_vide_espaces,
  SUM(CASE WHEN fournisseur_bareme_id IS NULL THEN 1 ELSE 0 END) AS fournisseur_NULL,
  SUM(CASE WHEN contact_texte IS NULL THEN 1 ELSE 0 END) AS contact_texte_NULL,
  SUM(CASE WHEN contact_texte = '' OR (contact_texte IS NOT NULL AND TRIM(contact_texte) = '') THEN 1 ELSE 0 END) AS contact_texte_vide_espaces,
  SUM(CASE WHEN unite_prestation IS NULL THEN 1 ELSE 0 END) AS unite_prestation_NULL,
  SUM(CASE WHEN unite_prestation = '' OR (unite_prestation IS NOT NULL AND TRIM(unite_prestation) = '') THEN 1 ELSE 0 END) AS unite_prestation_vide_espaces
FROM bareme_lignes_prix;

-- Détail par TYPE de ligne (MATERIAU vs PRESTATION_ENTETE etc.) — champs vides
SELECT '=== 6b. LIGNES DE PRIX — Champs vides par TYPE ===' AS section;
SELECT
  type,
  COUNT(*) AS nb,
  SUM(CASE WHEN reference IS NULL OR TRIM(COALESCE(reference,'')) = '' THEN 1 ELSE 0 END) AS ref_vide,
  SUM(CASE WHEN libelle IS NULL OR TRIM(COALESCE(libelle,'')) = '' THEN 1 ELSE 0 END) AS libelle_vide,
  SUM(CASE WHEN unite IS NULL OR TRIM(COALESCE(unite,'')) = '' THEN 1 ELSE 0 END) AS unite_vide,
  SUM(CASE WHEN prix_ttc IS NULL THEN 1 ELSE 0 END) AS prix_ttc_NULL,
  SUM(CASE WHEN fournisseur_bareme_id IS NULL THEN 1 ELSE 0 END) AS fournisseur_NULL,
  SUM(CASE WHEN contact_texte IS NULL OR TRIM(COALESCE(contact_texte,'')) = '' THEN 1 ELSE 0 END) AS contact_texte_vide,
  SUM(CASE WHEN date_prix IS NULL OR TRIM(COALESCE(date_prix,'')) = '' THEN 1 ELSE 0 END) AS date_prix_vide
FROM bareme_lignes_prix
GROUP BY type
ORDER BY type;

-- Exemples de LIGNES dont les champs affichés en liste frontend sont vides
SELECT '=== 6c. LIGNES — Exemples avec référence OU libellé OU unité OU fournisseur vide (liste frontend) ===' AS section;
SELECT
  l.id,
  l.type,
  l.reference,
  LEFT(l.libelle, 60) AS libelle,
  l.unite,
  l.prix_ttc,
  l.date_prix,
  f.nom AS fournisseur_nom,
  l.contact_texte,
  ce.code AS corps_etat
FROM bareme_lignes_prix l
LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
LEFT JOIN bareme_corps_etat ce ON ce.id = l.corps_etat_id
WHERE (l.reference IS NULL OR TRIM(COALESCE(l.reference,'')) = '')
   OR (l.libelle IS NULL OR TRIM(COALESCE(l.libelle,'')) = '')
   OR (l.unite IS NULL OR TRIM(COALESCE(l.unite,'')) = '')
   OR l.fournisseur_bareme_id IS NULL
   OR (l.contact_texte IS NULL OR TRIM(COALESCE(l.contact_texte,'')) = '')
   OR (l.date_prix IS NULL OR TRIM(COALESCE(l.date_prix,'')) = '')
ORDER BY l.id
LIMIT 100;

-- Valeurs distinctes "bizarres" (espaces seuls, très court) pour libellé / référence / unité
SELECT '=== 6d. LIGNES — Valeurs distinctes pour libellé (longueur 0 à 5 caractères) ===' AS section;
SELECT longueur_libelle, nb, exemple
FROM (
  SELECT LENGTH(TRIM(COALESCE(libelle,''))) AS longueur_libelle, COUNT(*) AS nb, LEFT(libelle, 30) AS exemple
  FROM bareme_lignes_prix
  GROUP BY LENGTH(TRIM(COALESCE(libelle,''))), LEFT(libelle, 30)
) t
WHERE longueur_libelle <= 5
ORDER BY nb DESC
LIMIT 30;

SELECT '=== 6e. LIGNES — Valeurs distinctes pour référence (vides ou très courtes) ===' AS section;
SELECT reference, COUNT(*) AS nb
FROM bareme_lignes_prix
WHERE reference IS NULL OR TRIM(COALESCE(reference,'')) = '' OR LENGTH(TRIM(reference)) <= 3
GROUP BY reference
ORDER BY nb DESC
LIMIT 20;

SELECT '=== 6f. LIGNES — Valeurs distinctes pour unité (vides ou courtes) ===' AS section;
SELECT unite, COUNT(*) AS nb
FROM bareme_lignes_prix
WHERE unite IS NULL OR TRIM(COALESCE(unite,'')) = '' OR LENGTH(TRIM(unite)) <= 2
GROUP BY unite
ORDER BY nb DESC
LIMIT 20;

-- =====================
-- PARTIE 7 : SYNTHÈSE "POURQUOI LE FRONTEND A DES ESPACES VIDES"
-- =====================
SELECT '=== 7. SYNTHÈSE — Nombre de lignes avec au moins un champ vide (affiché en liste) ===' AS section;
SELECT COUNT(*) AS lignes_avec_au_moins_un_champ_vide_visible
FROM bareme_lignes_prix l
WHERE (l.reference IS NULL OR TRIM(COALESCE(l.reference,'')) = '')
   OR (l.libelle IS NULL OR TRIM(COALESCE(l.libelle,'')) = '')
   OR (l.unite IS NULL OR TRIM(COALESCE(l.unite,'')) = '')
   OR l.fournisseur_bareme_id IS NULL
   OR (l.contact_texte IS NULL OR TRIM(COALESCE(l.contact_texte,'')) = '')
   OR (l.date_prix IS NULL OR TRIM(COALESCE(l.date_prix,'')) = '');

-- Répartition : combien de champs vides par ligne (pour les lignes qui en ont au moins 1)
SELECT '=== 7b. SYNTHÈSE — Nombre de champs vides par ligne (lignes concernées) ===' AS section;
SELECT nb_champs_vides, COUNT(*) AS nb_lignes
FROM (
  SELECT
    (CASE WHEN reference IS NULL OR TRIM(COALESCE(reference,'')) = '' THEN 1 ELSE 0 END +
     CASE WHEN libelle IS NULL OR TRIM(COALESCE(libelle,'')) = '' THEN 1 ELSE 0 END +
     CASE WHEN unite IS NULL OR TRIM(COALESCE(unite,'')) = '' THEN 1 ELSE 0 END +
     CASE WHEN fournisseur_bareme_id IS NULL THEN 1 ELSE 0 END +
     CASE WHEN contact_texte IS NULL OR TRIM(COALESCE(contact_texte,'')) = '' THEN 1 ELSE 0 END +
     CASE WHEN date_prix IS NULL OR TRIM(COALESCE(date_prix,'')) = '' THEN 1 ELSE 0 END) AS nb_champs_vides
  FROM bareme_lignes_prix
  WHERE (reference IS NULL OR TRIM(COALESCE(reference,'')) = '')
     OR (libelle IS NULL OR TRIM(COALESCE(libelle,'')) = '')
     OR (unite IS NULL OR TRIM(COALESCE(unite,'')) = '')
     OR fournisseur_bareme_id IS NULL
     OR (contact_texte IS NULL OR TRIM(COALESCE(contact_texte,'')) = '')
     OR (date_prix IS NULL OR TRIM(COALESCE(date_prix,'')) = '')
) t
GROUP BY nb_champs_vides
ORDER BY nb_champs_vides;

-- =====================
-- PARTIE 8 : DONNÉES COMPLÈTES (comme avant — listes + échantillon)
-- =====================
SELECT '=== 8. COEFFICIENTS (tous) ===' AS section;
SELECT id, nom, pourcentage, coefficient, note, ordre_affichage FROM bareme_coefficients_eloignement ORDER BY ordre_affichage, nom;

SELECT '=== 9. CORPS D''ÉTAT (tous) ===' AS section;
SELECT id, code, libelle, ordre_affichage FROM bareme_corps_etat ORDER BY ordre_affichage;

SELECT '=== 10. FOURNISSEURS (tous) ===' AS section;
SELECT id, nom, contact FROM bareme_fournisseurs ORDER BY nom;

SELECT '=== 11. LIGNES DE PRIX par type ===' AS section;
SELECT type, COUNT(*) AS nb FROM bareme_lignes_prix GROUP BY type ORDER BY type;

SELECT '=== 12. LIGNES par corps d''état ===' AS section;
SELECT ce.code, ce.libelle, COUNT(l.id) AS nb_lignes
FROM bareme_corps_etat ce
LEFT JOIN bareme_lignes_prix l ON l.corps_etat_id = ce.id
GROUP BY ce.id, ce.code, ce.libelle
ORDER BY ce.ordre_affichage;

SELECT '=== 13. Échantillon 200 lignes (id, type, ref, libellé, unité, prix, fournisseur, contact, date) ===' AS section;
SELECT l.id, l.type, l.reference, LEFT(l.libelle, 50) AS libelle, l.unite, l.prix_ttc, l.date_prix, f.nom AS fournisseur, l.contact_texte
FROM bareme_lignes_prix l
LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
ORDER BY l.id
LIMIT 200;
