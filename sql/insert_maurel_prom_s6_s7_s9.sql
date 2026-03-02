-- Maurel & Prom – Gare fluviale Lambaréné (projet 25) : Réalisé S6, Prévu S7, Suivi S9. NR = 0%.
SET NAMES utf8mb4;

-- Réalisé S6
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(25, 6, 2026, 'Commande et appro latérite', 'HEBDOMADAIRE', '2026-02-02', '2026-02-08', 50, NOW(), NOW()),
(25, 6, 2026, 'Commande et livraison de géotextile – 7 rouleaux livrés sur 7 commandés', 'HEBDOMADAIRE', '2026-02-02', '2026-02-08', 100, NOW(), NOW()),
(25, 6, 2026, 'Construction voie de circulation sur le site', 'HEBDOMADAIRE', '2026-02-02', '2026-02-08', 50, NOW(), NOW()),
(25, 6, 2026, 'Evacuation des déblais en berge – Etat des lieux topo réalisés', 'HEBDOMADAIRE', '2026-02-02', '2026-02-08', 100, NOW(), NOW()),
(25, 6, 2026, 'Commande enrochement pour zone pontons', 'HEBDOMADAIRE', '2026-02-02', '2026-02-08', 0, NOW(), NOW());

-- Prévu S7
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(25, 7, 2026, 'Commande et appro latérite', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(25, 7, 2026, 'Commande et livraison de géotextile', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(25, 7, 2026, 'Construction voie de circulation sur le site', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(25, 7, 2026, 'Evacuation des déblais en berge', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(25, 7, 2026, 'Commande enrochement pour zone pontons', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(25, 7, 2026, 'Commande 3 camions / 1 compacteur / 1 tractopelle', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW());

-- Suivi S9
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(25, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());
