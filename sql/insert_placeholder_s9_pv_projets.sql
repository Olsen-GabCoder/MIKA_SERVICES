-- Pour que tous les projets du PV s'affichent en partie 4 (semaine en cours)
-- Une ligne "Suivi semaine 9" à 0% pour chaque projet PV qui n'a pas encore de prévisions S9
-- Projets déjà avec données S9 : 12, 14, 15, 18 → on n'ajoute rien pour eux

SET NAMES utf8mb4;

INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(3,  9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(7,  9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(8,  9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(9,  9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(10, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(13, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(16, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(17, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(20, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(21, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(25, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(26, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(27, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(28, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(29, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(30, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(32, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(33, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());
