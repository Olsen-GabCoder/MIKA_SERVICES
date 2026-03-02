-- Marché 01/MMPEB – Centre d'appui à la pêche artisanale à Donguila (projet 15)
-- Études, points bloquants, besoins. Réalisé → S8 | Prévu S9 → S9 | Pas de prévisions S10.
SET NAMES utf8mb4;

-- ========== 1. Avancement des études (APS 100%, APD 100%, EXE 50%) ==========
DELETE FROM avancement_etude_projet WHERE projet_id = 15;
INSERT INTO avancement_etude_projet (projet_id, phase, avancement_pct, date_depot, etat_validation, created_at, updated_at) VALUES
(15, 'APS', 100, NULL, NULL, NOW(), NOW()),
(15, 'APD', 100, NULL, NULL, NOW(), NOW()),
(15, 'EXE', 50, NULL, NULL, NOW(), NOW());

-- ========== 2. Points bloquants ==========
DELETE FROM points_bloquants WHERE projet_id = 15;

INSERT INTO points_bloquants (projet_id, titre, description, priorite, statut, date_detection, created_at, updated_at) VALUES
(15, 'Demande acompte supplémentaire pour remobilisation personnel EBTP', '1ère maison de relogement', 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(15, 'Matériaux d''apport – investigation en cours', 'Objectif livraison fin février', 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(15, 'Attente intervention travaux de soudure (séparateur hydrocarbures)', 'Soudeur absent, retour prévu samedi 21/02/2026', 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW()),
(15, 'Retard en approvisionnement en matériaux et fourniture', 'Impact sur cadence de production (base vie)', 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW()),
(15, 'Matériaux d''apport – carrière Zamaligué', 'Voie principale inaccessible aux véhicules ; organisation en cours pour ouverture voie d''accès et sondages', 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW());

-- ========== 3. Besoins ==========
UPDATE projets SET
  besoins_materiel = 'Matériaux d''apport (blocs de latérite, appro en cours). Déplacement cuve sur bac de rétention, raccordement plombier bac / séparateur.',
  besoins_humain = 'Recrutement : IAQ, Conducteur de travaux, Assistant Logistique',
  updated_at = NOW()
WHERE id = 15;

-- ========== 4. Semaines : réalisé en S8, Prévu S9 en S9, aucune S10 ==========
DELETE FROM previsions WHERE projet_id = 15 AND semaine = 10 AND annee = 2026;
UPDATE previsions SET semaine = 8 WHERE projet_id = 15 AND semaine = 9 AND annee = 2026;

-- ========== 5. Prévu S9 (narratif PV : suite études, maisons, chantier, terrassement) ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(15, 9, 2026, 'Finalisation étude EXE (prévu 28/02)', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Transmission APD (prévue fin février)', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Livraison 1ère maison de relogement (objectif fin février)', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Suite construction 2e et 3e maisons de relogement', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Forage eaux – fin de l''action (VIETECH Gabon)', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Raccordement bac de rétention au regard puis séparateur hydrocarbures', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Coulage couvercle séparateur hydrocarbures (après retour soudeur)', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Construction base technique base vie – ossature en bois', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Base YAMETEK – tirer le hangar au droit du conteneur', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Poursuite travaux de terrassement généraux', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(15, 9, 2026, 'Visite de chantier avec les TP après transmission livrables pour validation implantations', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW());
