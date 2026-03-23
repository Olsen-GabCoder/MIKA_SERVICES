-- Extraction complète des données barème
-- Exécuter : mysql -u root -p mika_services_dev < scripts/dump-bareme.sql
-- Ou avec variables : mysql -u %DATABASE_USERNAME% -p%DATABASE_PASSWORD% mika_services_dev < scripts/dump-bareme.sql

SELECT '=== CORPS D''ÉTAT ===' AS section;
SELECT id, code, libelle, ordre_affichage, created_at, updated_at
FROM bareme_corps_etat
ORDER BY ordre_affichage, id;

SELECT '=== FOURNISSEURS ===' AS section;
SELECT id, nom, contact, created_at, updated_at
FROM bareme_fournisseurs
ORDER BY nom;

-- Tous les champs monétaires / prix du modèle : prix_ttc, prix_unitaire, somme, debourse, prix_vente, coefficient_pv
SELECT '=== LIGNES DE PRIX (lignes parents uniquement) ===' AS section;
SELECT
  l.id,
  c.code AS corps_etat_code,
  c.libelle AS corps_etat_libelle,
  l.type,
  l.reference,
  l.libelle,
  l.unite,
  l.prix_ttc,
  l.date_prix,
  f.nom AS fournisseur_nom,
  l.ref_reception,
  l.code_fournisseur,
  l.famille,
  l.categorie,
  l.quantite,
  l.prix_unitaire,
  l.somme,
  l.debourse,
  l.prix_vente,
  l.coefficient_pv,
  l.unite_prestation,
  l.prix_estime,
  l.contact_texte,
  l.parent_id,
  l.ordre_ligne,
  l.numero_ligne_excel,
  l.created_at,
  l.updated_at
FROM bareme_lignes_prix l
JOIN bareme_corps_etat c ON l.corps_etat_id = c.id
LEFT JOIN bareme_fournisseurs f ON l.fournisseur_bareme_id = f.id
WHERE l.parent_id IS NULL
ORDER BY c.ordre_affichage, c.id, l.ordre_ligne, l.numero_ligne_excel, l.id;

SELECT '=== LIGNES DE PRIX (lignes enfants, décomposition prestations) ===' AS section;
SELECT
  l.id,
  l.parent_id,
  c.code AS corps_etat_code,
  l.type,
  l.libelle,
  l.quantite,
  l.prix_unitaire,
  l.somme,
  l.debourse,
  l.prix_vente,
  l.coefficient_pv,
  l.unite_prestation,
  l.prix_estime,
  l.ordre_ligne,
  l.numero_ligne_excel,
  l.created_at,
  l.updated_at
FROM bareme_lignes_prix l
JOIN bareme_corps_etat c ON l.corps_etat_id = c.id
WHERE l.parent_id IS NOT NULL
ORDER BY l.parent_id, l.ordre_ligne, l.id;

-- Export brut : une ligne = toutes les colonnes table (aucun champ omis)
SELECT '=== EXPORT BRUT bareme_lignes_prix (SELECT *) ===' AS section;
SELECT * FROM bareme_lignes_prix ORDER BY corps_etat_id, id;

SELECT '=== STATISTIQUES ===' AS section;
SELECT
  (SELECT COUNT(*) FROM bareme_corps_etat) AS nb_corps_etat,
  (SELECT COUNT(*) FROM bareme_fournisseurs) AS nb_fournisseurs,
  (SELECT COUNT(*) FROM bareme_lignes_prix WHERE parent_id IS NULL) AS nb_lignes_parents,
  (SELECT COUNT(*) FROM bareme_lignes_prix WHERE parent_id IS NOT NULL) AS nb_lignes_enfants,
  (SELECT COUNT(*) FROM bareme_lignes_prix) AS nb_lignes_total;
