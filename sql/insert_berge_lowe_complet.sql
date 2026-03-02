-- Marché 52 – Berge de la LOWE (projet 14) : études, points bloquants, besoins, Prévu S10
SET NAMES utf8mb4;

-- ========== 1. Avancement des études (uniquement) ==========
-- Supprimer d'éventuelles entrées existantes pour projet 14
DELETE FROM avancement_etude_projet WHERE projet_id = 14;

INSERT INTO avancement_etude_projet (projet_id, phase, avancement_pct, date_depot, etat_validation, created_at, updated_at) VALUES
(14, 'APS', 80, NULL, NULL, NOW(), NOW()),
(14, 'APD', 50, '2026-02-19', 'En attente', NOW(), NOW()),
(14, 'EXE', 20, NULL, NULL, NOW(), NOW()),
(14, 'GEOTECHNIQUE', 50, '2025-12-18', 'En cours', NOW(), NOW()),
(14, 'HYDRAULIQUE', 90, '2026-02-16', 'En cours', NOW(), NOW()),
(14, 'EIES', 50, NULL, NULL, NOW(), NOW());

-- ========== 2. Points bloquants ==========
DELETE FROM points_bloquants WHERE projet_id = 14;

INSERT INTO points_bloquants (projet_id, titre, description, priorite, statut, date_detection, created_at, updated_at) VALUES
(14, 'Etudes d''exécution en cours', NULL, 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW()),
(14, 'Appro en sable de remblai et latérite (en cours)', NULL, 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW()),
(14, 'Intempéries', NULL, 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW()),
(14, 'Rupture d''appro Gasoil (depuis le 25/02)', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW());

-- ========== 3. Besoins (projet) ==========
UPDATE projets SET
  besoins_materiel = 'MAD Dumper au 28/02 • Choix des prestataires pour la réalisation des pieux • Appro Gasoil • Relancer le service achat pour habillage de 1 container 40 pied et 2 container 20 pied (en cours) • Véhicule CC terrassement et LABO impératif • Groupe électrogène',
  besoins_humain = NULL,
  updated_at = NOW()
WHERE id = 14;

-- ========== 4. Prévu S10 (prévisions semaine 10) ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(14, 10, 2026, 'Travaux de remblai plateforme zone marécageuse à 100%', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Démarrage travaux de purge sur CDM objectif 40 ml/jr', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Installation chantier (plomberie et électricité)', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Remblai de la plateforme de terrassement (couche de forme) objectif 600 m³', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Suite et fin de la campagne géotechnique', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Stockage du remblai de sable côté CDM à 40%', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Validation du projet routier', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW()),
(14, 10, 2026, 'Transmission décompte N°3 à 100%', 'HEBDOMADAIRE', '2026-03-02', '2026-03-08', 0, NOW(), NOW());
