-- Bel-Air (projet 13) : Réalisé S7, Prévu S8, Suivi S9. NR = 0%, Ok = 100%.
SET NAMES utf8mb4;

-- Réalisé S7 (Prévu S7 du PV avec Ok/NR)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(13, 7, 2026, 'Polygonale et implantation de l''emprise avec côte d''assainissement', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(13, 7, 2026, 'Consultation et validation des sous-traitant', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(13, 7, 2026, 'Devis pour travaux des toilettes', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(13, 7, 2026, 'Prévoir présentation ICG', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(13, 7, 2026, 'Continuité et fin de la clôture', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(13, 7, 2026, 'Prévoir courrier raccordement eau et électricité', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(13, 7, 2026, 'Passation Gabriel Xavier', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(13, 7, 2026, 'Essais de portance et sondage', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW());

-- Prévu S8
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(13, 8, 2026, 'Consultation des SST (SOW et ?)', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Implantation et construction des atelier base vie', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Présentation avec ICG', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Suite travaux GEOTHEC, essais au pénétromètre', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Contrôle et ajustement des implantations et suite nivellement de la PST', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'MAJ physique des bâtisses impactées par le projet', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Courrier à l''Administration sur cadre bâti impacté par le projet', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Appro divers en matériaux', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Constat d''état des lieux avec l''huissier', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(13, 8, 2026, 'Courrier à la SEEG, Gabon Télécom, CNE', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW());

-- Suivi S9 (semaine en cours)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(13, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());
