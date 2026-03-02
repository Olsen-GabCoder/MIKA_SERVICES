-- Réalisations Semaine 9 — Projet 27 (Marché 95 – LALALA, 5e Arrondissement)
-- Contenu conforme au PV : Réalisé S8 du PV, saisi en S9 pour affichage « Semaine en cours ». NR → 0 %.

SET NAMES utf8mb4;

-- Suppression du placeholder « Suivi semaine 9 » existant pour le projet 27
DELETE FROM previsions WHERE projet_id = 27 AND semaine = 9 AND annee = 2026;

-- Projet 27 — TRAVAUX DE REAMENAGEMENT DES VOIRIES DU CINQUIEME ARRONDISSEMENT, QUARTIER LALALA
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Aménagement de la plateforme de la base vie (zone 2)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Début construction de la clôture de la base vie', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Plan d''installation de chantier', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Mobilisation des engins (1 niveleuse / 1 compacteur 15T / 1 compacteur 90)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Validation de la polygonale en interne', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Sondage du sol en place des pénétrantes 6,5,4,3 par le labo', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(27, 9, 2026, 'TRAVAUX PREPARATOIRES — Lancer études hydrauliques et hydrologiques', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(27, 9, 2026, 'DORSALE — Nettoyage générale de l''emprise de la dorsale', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(27, 9, 2026, 'DORSALE — Identification des poteaux et compteurs d''eau SEEG et Sinohydro', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(27, 9, 2026, 'PENETRANTES — Nettoyage générale des pénétrantes 6,5,4,3 et 2', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(27, 9, 2026, 'PENETRANTES — Identification des poteaux et compteurs d''eau SEEG et Sinohydro', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW());
