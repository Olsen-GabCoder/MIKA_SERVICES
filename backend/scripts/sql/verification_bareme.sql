-- ============================================================
-- Vérification des données barème après import Excel
-- Base : mika_services_dev (ou celle configurée dans application-dev.yml)
-- ============================================================

-- 1) Nombre d'enregistrements par table
SELECT 'bareme_coefficients_eloignement' AS table_name, COUNT(*) AS nb FROM bareme_coefficients_eloignement
UNION ALL
SELECT 'bareme_corps_etat', COUNT(*) FROM bareme_corps_etat
UNION ALL
SELECT 'bareme_fournisseurs', COUNT(*) FROM bareme_fournisseurs
UNION ALL
SELECT 'bareme_lignes_prix', COUNT(*) FROM bareme_lignes_prix;

-- 2) Liste des corps d'état (feuilles Excel)
SELECT id, code, libelle, ordre_affichage
FROM bareme_corps_etat
ORDER BY ordre_affichage;

-- 3) Coefficients d'éloignement (aperçu)
SELECT id, nom, pourcentage, coefficient, LEFT(note, 60) AS note_extrait
FROM bareme_coefficients_eloignement
ORDER BY ordre_affichage
LIMIT 15;

-- 4) Nombre de lignes de prix par type
SELECT type, COUNT(*) AS nb
FROM bareme_lignes_prix
GROUP BY type
ORDER BY type;

-- 5) Nombre de lignes par corps d'état
SELECT ce.code, ce.libelle, COUNT(l.id) AS nb_lignes
FROM bareme_corps_etat ce
LEFT JOIN bareme_lignes_prix l ON l.corps_etat_id = ce.id
GROUP BY ce.id, ce.code, ce.libelle
ORDER BY ce.ordre_affichage;

-- 6) Quelques fournisseurs
SELECT id, nom, contact
FROM bareme_fournisseurs
ORDER BY nom
LIMIT 20;

-- 7) Exemples de lignes matériaux (Gros-Oeuvre)
SELECT l.id, l.reference, LEFT(l.libelle, 40) AS libelle, l.unite, l.prix_ttc, f.nom AS fournisseur
FROM bareme_lignes_prix l
JOIN bareme_corps_etat ce ON ce.id = l.corps_etat_id
LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
WHERE ce.code LIKE '%GROS%' AND l.type = 'MATERIAU'
ORDER BY l.ordre_ligne
LIMIT 15;

-- 8) Exemples de prestations avec sous-détails (entête + enfants)
SELECT
  p.id AS entete_id,
  LEFT(p.libelle, 50) AS prestation,
  COUNT(e.id) AS nb_lignes_enfant,
  (SELECT SUM(l.somme) FROM bareme_lignes_prix l WHERE l.parent_id = p.id AND l.type = 'PRESTATION_LIGNE') AS somme_lignes
FROM bareme_lignes_prix p
LEFT JOIN bareme_lignes_prix e ON e.parent_id = p.id
WHERE p.type = 'PRESTATION_ENTETE'
GROUP BY p.id, p.libelle
LIMIT 10;
