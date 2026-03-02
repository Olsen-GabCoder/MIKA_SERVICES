-- Marché 147 – Camp De Gaulle / Jardin Botanique (projet 7) : études, prévisions S5/S6/S9, point bloquant
SET NAMES utf8mb4;

-- ========== 1. Avancement des études ==========
DELETE FROM avancement_etude_projet WHERE projet_id = 7;

INSERT INTO avancement_etude_projet (projet_id, phase, avancement_pct, date_depot, etat_validation, created_at, updated_at) VALUES
(7, 'EXE', 50, NULL, NULL, NOW(), NOW()),
(7, 'EIES', 100, NULL, NULL, NOW(), NOW());

-- ========== 2. Prévu S5 ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(7, 5, 2026, 'Transmission accostage et décompte N°8 le 02/02', 'HEBDOMADAIRE', '2026-01-26', '2026-02-01', 0, NOW(), NOW());

-- ========== 3. Prévu S6 ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(7, 6, 2026, 'Transmission accostage et décompte N°8', 'HEBDOMADAIRE', '2026-02-02', '2026-02-08', 0, NOW(), NOW());

-- ========== 4. Suivi S9 ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(7, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());

-- ========== 5. Point bloquant ==========
DELETE FROM points_bloquants WHERE projet_id = 7;

INSERT INTO points_bloquants (projet_id, titre, description, priorite, statut, date_detection, created_at, updated_at) VALUES
(7, 'Attente conclusion du dossier d''accostage', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW());

-- ========== 6. Besoins (non renseignés dans le PV, on laisse vides) ==========
-- UPDATE projets SET besoins_materiel = NULL, besoins_humain = NULL, updated_at = NOW() WHERE id = 7;
-- Optionnel : ne pas écraser si déjà des valeurs
