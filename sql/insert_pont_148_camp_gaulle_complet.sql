-- Marché 148 – Pont carrefour Camp De Gaulle à Libreville (projet 8) : tout (réalisé S7, prévu S8, points bloquants, besoins, suivi S9)
SET NAMES utf8mb4;

-- ========== 1. Réalisé S7 ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(8, 7, 2026, '15 poutres de 19/90 soit 217/238', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 91, NOW(), NOW()),
(8, 7, 2026, '03 poutres de 17/40 – 52/84', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 62, NOW(), NOW()),
(8, 7, 2026, '20 Corniche de type A – 217/238', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 91, NOW(), NOW()),
(8, 7, 2026, '10 Pieux de 800', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 0, NOW(), NOW()),
(8, 7, 2026, '10 Pieux de 1000 – Recepage de 5 pieux', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(8, 7, 2026, 'Carottage de 2 pieux de 800', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW()),
(8, 7, 2026, '03 demi-chevêtres', 'HEBDOMADAIRE', '2026-02-09', '2026-02-15', 100, NOW(), NOW());

-- ========== 2. Prévu S8 ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(8, 8, 2026, '18 poutres de 17/90 soit 3/jours', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, '20 corniches de type A', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, '03 demi-chevêtres (coffrage perdu du chevêtre)', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, '1 pieu 800 – forés et coulés', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, '9 pieux de 1000 – forés et coulés', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, '5 pieux de 800 recépés', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, 'Coulage BP de la culée C15, P13 et P14 (30 m³)', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, 'Carottage des pieux C15-87 et C1-5', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, 'Essai de convenance pour le coulage des poteaux avec l''adjuvant OMEGA dosé à 1,8%', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW()),
(8, 8, 2026, 'Auscultation de 18 pieux minimum à partir du 12/02/2026', 'HEBDOMADAIRE', '2026-02-16', '2026-02-22', 0, NOW(), NOW());

-- ========== 3. Suivi S9 ==========
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(8, 9, 2026, 'Suivi semaine 9', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());

-- ========== 4. Points bloquants ==========
DELETE FROM points_bloquants WHERE projet_id = 8;

INSERT INTO points_bloquants (projet_id, titre, description, priorite, statut, date_detection, created_at, updated_at) VALUES
(8, 'Fibre optique', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(8, 'Haute tension 2000 V', NULL, 'HAUTE', 'OUVERT', CURDATE(), NOW(), NOW()),
(8, 'Auscultation sonique des pieux', NULL, 'NORMALE', 'OUVERT', CURDATE(), NOW(), NOW());

-- ========== 5. Besoins ==========
UPDATE projets SET
  besoins_materiel = 'Sable : 4 camions/jours • Paiement des factures ATRICOM • Paiement des factures LG2E • Livraison du ciment vrac tous les 3 jours • Livraison des agrégats chez AVANTIS • Livraison du sable pour les remblais (culées et longrine de répartition) • Livraison de 150 tonnes de 0/25 (reste de la commande DA n°028057 du 27/06/2025)',
  besoins_humain = 'Ressource en appui à l''IAQ (affectation de l''HES pour stage d''immersion au service qualité) • 1 ouvrier qualifié pour le laboratoire pont • 2 stagiaires génie-civil (ayant un minimum de connaissance en logiciel Excel)',
  updated_at = NOW()
WHERE id = 8;
