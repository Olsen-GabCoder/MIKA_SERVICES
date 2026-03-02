-- Marché 53 – JB / Camp de Gaulle / Bord de Mer (projet 18) : études, points bloquants, besoins, semaines corrigées
-- Réalisé S8 → semaine 8 | Prévu S9 → semaine 9 | Semaine 10 : aucune prévision (sera fait après la réunion).
SET NAMES utf8mb4;

-- ========== 1. Avancement des études (EIES 20%) ==========
DELETE FROM avancement_etude_projet WHERE projet_id = 18;
INSERT INTO avancement_etude_projet (projet_id, phase, avancement_pct, date_depot, etat_validation, created_at, updated_at) VALUES
(18, 'EIES', 20, NULL, NULL, NOW(), NOW());

-- ========== 2. Points bloquants ==========
DELETE FROM points_bloquants WHERE projet_id = 18;

INSERT INTO points_bloquants (projet_id, titre, description, priorite, statut, date_detection, created_at, updated_at) VALUES
(18, 'Absence de stock de blocs latéritiques', 'Ce approvisionné est mis en œuvre immédiatement', 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(18, 'Absence de stock conséquent de latérites', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(18, 'Absence conséquente de blocs Granitique 400/600 et 0/240', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(18, 'Absence de sable de remblais conforme aux spécifications du cahier de charge', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(18, 'Problème de disponibilité de ressources matériels', NULL, 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW()),
(18, 'Absence de dossier d''exécution ou plan d''exécution', 'SAOTI, MAYENA ROUTE, ENTREE Mr ACK aménagement, voie jouxtant le BV, le CANAL, VALIDATION POLYGONALE BDM SIGNATURE DU MARCHE avec implantation des ouvrages', 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW());

-- ========== 3. Besoins ==========
UPDATE projets SET
  besoins_materiel = '02 containers Voie Gustave • 01 Container aménagé BDM • Capacité de stockage du carburant de 20 mille à 40 ou 50 mille L commande • Alimentation en eau Préfa Compteur voie Gustave • Installation de chantier BDM : Panneau de chantier, Clôture de chantier, Bureaux (container aménagé), Toilette amovible (commande de 3 toilettes), Alimentation en eau et électricité • Mobilisation d''un chargeur 2 HSE • Blocs latérite en cours avec deux fournisseurs • Latérite en cours avec deux fournisseurs • Blocs 0/240 Blocs 400/600 pour BDM • GNT 0/25 deux fournisseurs',
  besoins_humain = '7 HTM dont 04 au BDM et 2 voies AMO et 1 voie GUSTAVE • 01 flagman (agent signaleur)',
  updated_at = NOW()
WHERE id = 18;

-- ========== 4. Semaines : S9 → S8 (réalisé), Prévu S9 en S9, aucune S10 ==========
DELETE FROM previsions WHERE projet_id = 18 AND semaine = 10 AND annee = 2026;
UPDATE previsions SET semaine = 8 WHERE projet_id = 18 AND semaine = 9 AND annee = 2026;

-- ========== 5. Prévu S9 → en semaine 9 (aucune prévision en S10 pour l’instant) ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(18, 9, 2026, 'Voie AMO : Poursuite terrassements avec purge et mise en œuvre des matériaux sélectionnés jusqu''à la PST', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre de la couche de fondation en latérites', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre de la couche de base en GNT 0/25', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Voie de contournement : Poursuite mise en œuvre de perré maçonné, Purge Profil 17, Terrassement Rond-Point provisoire', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Poursuite mise en œuvre de bordures T4 et CS3, Début coulage massifs pour blocs fleurs', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Voie Gustave : Mise en œuvre de la couche de Base en GNT 0/25 du P 14 - P22', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Suite pose caniveaux côté mur de soutènement', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Implantation de caniveaux et excavation avec réglage et coulage du BP, Pose caniveaux côté Gustave Bongo', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Implantation des bordures avec début de pose', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Réalisation d''ouverture sur voile de l''OH, Réalisation de poteaux sur paroi continuité OH', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Déplacement de réseaux existant sur emprise des travaux', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Sortie Mayena : Suite et fin coulage des massifs, Suite terrassement pour drains de la plateforme', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Dossier ou plan d''exécution de la voie', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Saoti : Purge et mise en œuvre des remblais reconstitution de la plateforme support de terrassement', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Sortie Kalikak : Terrassement de la partie à riper, Purge et reconstitution de la plateforme', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Implantation du caniveau, Réglage de la PST et mise en œuvre de la couche de fondation et base', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Aménagement Bord de Mer : Validation de la polygonale', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Implantation de l''emprise des travaux', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Réalisation de clôture chantier', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW()),
(18, 9, 2026, 'Poursuite terrassement y/c réalisation de la plateforme et mise en œuvre des blocs pour stabilisation du talus', 'HEBDOMADAIRE', '2026-02-24', '2026-03-02', 0, NOW(), NOW());
