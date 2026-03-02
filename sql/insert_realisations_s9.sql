-- Réalisations Semaine 9 (S9) — année 2026 — configuration actuelle, NR = 0%
-- Projets : Akémidjogoni (12), Berge de la LOWE (14), Donguila CAPA (15), Nouvelles Voies JB / Bord de Mer (18)

SET NAMES utf8mb4;

-- Projet 12 — TRAVAUX D'AMANAGEMENT DES VOIRIES DE DESSERTE DU QUARTIER AKEMIDJONGONI (Gabriel ONDO MVONO)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(12, 9, 2026, 'Aménagement espace vert P19-P18 — 23 m²', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Coulage trottoir P22-P15 l''autre côté — 13,61 m³', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Continuité pose bordures T2 P18-P10 — 130,51 ml', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Finitions muret de protection des trottoirs P30-P22 — 92,12 ml', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Rehausse Mur de soutènement côté buse P21-P15 — 55 ml', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Coulage des dalles tamponnées sur regard (2)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Pose des bacs à fleurs sur canal patrimoine côté trottoir — 20 ml', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(12, 9, 2026, 'Continuité d''épaulement en remblais sable du canal patrimoine — 50 m³', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Aménagement + enrochement zone parking', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(12, 9, 2026, 'Aménagement + enrochement zone plateau sportif', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(12, 9, 2026, 'Continuité épaulement de canal en remblais de sable — 300 m³', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(12, 9, 2026, 'Pose des caniveaux 50 P6-P11 côté gauche et côté droit — 111 ml', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(12, 9, 2026, 'Mise en œuvre latérite P6-P11 — 103,13 m³', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(12, 9, 2026, 'Enrochement de la voie — 600 Tonnes', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(12, 9, 2026, 'Enrochement + BP + radier canal OH5 vers Marine — 20 ml', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW());

-- Projet 14 — BERGE DE LA LOWE (Olivier WEMEYI)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(14, 9, 2026, 'Travaux de remblai plateforme à 100%', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(14, 9, 2026, 'Installation chantier', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 48, NOW(), NOW()),
(14, 9, 2026, 'Démarrage travaux de purge sur CDM', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 2, NOW(), NOW()),
(14, 9, 2026, 'Installation chantier (plomberie et électricité)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(14, 9, 2026, 'Remblai', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(14, 9, 2026, 'Suite campagne géotechnique — P1/P2 terminé, en cours sur C0', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 75, NOW(), NOW()),
(14, 9, 2026, 'Stockage du remblai de sable côté CDM', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 15, NOW(), NOW()),
(14, 9, 2026, 'Coulage de 50 ml de perrés maçonnés', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(14, 9, 2026, 'Transmission décompte N°3', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 45, NOW(), NOW());

-- Projet 18 — NOUVELLES VOIES JB-CAMP DE GAULLE + AMENAGEMENT BORD DE MER (Ulrich Landry IBOUANA)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(18, 9, 2026, 'Reprise des terrassements depuis le 11 Février 2026 avec purge et fermeture immédiate', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre couche de fondation', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Réalisation des allées bétonnées', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 70, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre GNT 0/25 sur la bretelle et réception', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 90, NOW(), NOW()),
(18, 9, 2026, 'Pose de bordures et CS3', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 35, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre du caniveau', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 80, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre perré maçonné', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 65, NOW(), NOW()),
(18, 9, 2026, 'Début coulage massifs pour blocs fleurs', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(18, 9, 2026, 'Implantation et pose des caniveaux', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 60, NOW(), NOW()),
(18, 9, 2026, 'Réglage couche de fondation', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 70, NOW(), NOW()),
(18, 9, 2026, '1ère couche de GNT', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 50, NOW(), NOW()),
(18, 9, 2026, 'Nettoyage du canal', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Réglage de la plateforme', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Renforcement de la plateforme par enrochement ou 0/24', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Réalisation des semelles isolées avec coulage des massifs', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 90, NOW(), NOW()),
(18, 9, 2026, 'Réalisation des drains sous dallage', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 50, NOW(), NOW()),
(18, 9, 2026, 'Nettoyage', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Implantation de la Voie', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 50, NOW(), NOW()),
(18, 9, 2026, 'Campagne Géotechnique sur la bretelle', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Réalisation des réglages et finitions', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Réception', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Réalisation des pieux en cours par DAMAS BTP', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(18, 9, 2026, 'Campagne labo côté gauche', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Décaissement voie existante couche de roulement', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Décaissement de l''engazonnement', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre des couches sousjacentes (Bloc Latéritiques, bloc granitique 0/240, couche de sable et latérite)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Nettoyage', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre des blocs latéritiques', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre de latérites en cours', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(18, 9, 2026, 'Approvisionnement en matériaux blocs granitiques en cours', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 0, NOW(), NOW()),
(18, 9, 2026, 'Réalisation de plateforme', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 20, NOW(), NOW()),
(18, 9, 2026, 'Mise en œuvre des blocs pour stabilisation des talus', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 15, NOW(), NOW());

-- Projet 15 — DONGUILA-CONSTRUCTION D'UN CAPA (Jérémie OMPINDI AKAGA)
INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at) VALUES
(15, 9, 2026, 'Études route, parking et Ponton', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 90, NOW(), NOW()),
(15, 9, 2026, 'Étude plateforme Bâtiment CAPAD', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 35, NOW(), NOW()),
(15, 9, 2026, 'Travaux préparatoires', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 60, NOW(), NOW()),
(15, 9, 2026, 'Construction 1ère maison de relogement (matériaux : plomberie, électricité, carreaux)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 70, NOW(), NOW()),
(15, 9, 2026, 'Construction 2e et 3e maisons de relogement — phase pré-terrassement', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 90, NOW(), NOW()),
(15, 9, 2026, 'Bac de rétention (travaux achevés)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 100, NOW(), NOW()),
(15, 9, 2026, 'Séparateur d''hydrocarbures — coffrage du couvercle prêt pour coulage', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 85, NOW(), NOW()),
(15, 9, 2026, 'Construction base technique / base vie (dallage réalisé)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 45, NOW(), NOW()),
(15, 9, 2026, 'Base YAMETEK (conteneur bureau posé)', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 50, NOW(), NOW()),
(15, 9, 2026, 'Installation chantier', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 70, NOW(), NOW()),
(15, 9, 2026, 'Travaux de terrassement généraux', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 40, NOW(), NOW());
