-- =============================================================================
-- MIKA SERVICES — Structure des tables (section prévisions/avancement)
-- et données de test pour vérification de l'affichage
-- Base : MySQL (mika_services_dev)
-- Date : 2026-02-21
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STRUCTURE DES TABLES CONCERNÉES
-- ─────────────────────────────────────────────────────────────────────────────

-- Table principale : projets
-- (affichée à titre de référence — ne pas exécuter si elle existe déjà)
/*
CREATE TABLE IF NOT EXISTS projets (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    code_projet      VARCHAR(50)  NOT NULL UNIQUE,
    numero_marche    VARCHAR(100),
    nom              VARCHAR(300) NOT NULL,
    description      TEXT,
    type             VARCHAR(30)  NOT NULL,
    type_personnalise VARCHAR(150),
    statut           VARCHAR(30)  NOT NULL DEFAULT 'EN_ATTENTE',
    client_id        BIGINT,
    source_financement VARCHAR(30),
    imputation_budgetaire VARCHAR(100),
    province         VARCHAR(100),
    ville            VARCHAR(100),
    quartier         VARCHAR(100),
    adresse          VARCHAR(500),
    latitude         DOUBLE,
    longitude        DOUBLE,
    superficie       DECIMAL(15,2),
    condition_acces  VARCHAR(20),
    zone_climatique  VARCHAR(20),
    distance_depot_km DOUBLE,
    nombre_ouvriers_prevu INT,
    horaire_travail  VARCHAR(50),
    montant_ht       DECIMAL(20,2),
    montant_ttc      DECIMAL(20,2),
    montant_initial  DECIMAL(20,2),
    montant_revise   DECIMAL(20,2),
    delai_mois       INT,
    mode_suivi_mensuel VARCHAR(10) DEFAULT 'AUTO',
    date_debut       DATE,
    date_fin         DATE,
    date_debut_reel  DATE,
    date_fin_reelle  DATE,
    avancement_global      DECIMAL(5,2) DEFAULT 0,
    avancement_physique_pct DECIMAL(5,2),
    avancement_financier_pct DECIMAL(5,2),
    delai_consomme_pct DECIMAL(5,2),
    besoins_materiel TEXT,
    besoins_humain   TEXT,
    observations     TEXT,
    propositions_amelioration TEXT,
    responsable_projet_id BIGINT,
    partenaire_principal VARCHAR(200),
    actif            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    INDEX idx_projet_numero_marche (numero_marche),
    INDEX idx_projet_code (code_projet),
    INDEX idx_projet_statut (statut),
    INDEX idx_projet_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

-- Table : previsions (tâches planifiées / réalisées par semaine)
-- Structure ACTUELLE après suppression de la colonne "statut"
/*
CREATE TABLE IF NOT EXISTS previsions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    projet_id        BIGINT       NOT NULL,
    semaine          INT,
    annee            INT          NOT NULL,
    description      TEXT,
    type             VARCHAR(30)  NOT NULL,
    date_debut       DATE,
    date_fin         DATE,
    avancement_pct   INT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    INDEX idx_prevision_projet (projet_id),
    INDEX idx_prevision_semaine_annee (semaine, annee),
    CONSTRAINT fk_prevision_projet FOREIGN KEY (projet_id) REFERENCES projets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

-- Table : points_bloquants
/*
CREATE TABLE IF NOT EXISTS points_bloquants (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    projet_id        BIGINT       NOT NULL,
    titre            VARCHAR(300) NOT NULL,
    description      TEXT,
    priorite         VARCHAR(20)  NOT NULL DEFAULT 'NORMALE',
    statut           VARCHAR(20)  NOT NULL DEFAULT 'OUVERT',
    detecte_par_id   BIGINT,
    assigne_a_id     BIGINT,
    date_detection   DATE NOT NULL,
    date_resolution  DATE,
    action_corrective TEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    INDEX idx_pb_projet (projet_id),
    INDEX idx_pb_statut (statut),
    INDEX idx_pb_priorite (priorite),
    CONSTRAINT fk_pb_projet FOREIGN KEY (projet_id) REFERENCES projets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NETTOYAGE DE LA COLONNE "statut" DANS PREVISIONS (si elle existe encore)
-- ─────────────────────────────────────────────────────────────────────────────

-- Hibernate DDL auto=update ne supprime pas les colonnes.
-- Exécuter cette commande pour nettoyer la colonne orpheline :
ALTER TABLE previsions DROP COLUMN IF EXISTS statut;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RÉCUPÉRATION DES IDS DE PROJETS EXISTANTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Vérifier les projets disponibles :
SELECT id, code_projet, nom, statut FROM projets WHERE actif = TRUE ORDER BY id;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SUPPRESSION DES ANCIENNES PRÉVISIONS DE TEST
-- ─────────────────────────────────────────────────────────────────────────────

-- (Optionnel) Vider les prévisions existantes pour repartir proprement :
-- DELETE FROM previsions;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DONNÉES DE TEST — PRÉVISIONS POUR TOUS LES PROJETS
--    Semaine 9 = semaine en cours (24 fév — 28 fév 2026)
--    Semaine 10 = semaine suivante (prévisions)
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- Procédure d'insertion automatique pour TOUS les projets existants
-- ═══════════════════════════════════════════════════════════════════════════

DELIMITER //

DROP PROCEDURE IF EXISTS insert_test_previsions //

CREATE PROCEDURE insert_test_previsions()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_projet_id BIGINT;
    DECLARE cur CURSOR FOR SELECT id FROM projets WHERE actif = TRUE ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Supprimer les anciennes prévisions de test (semaines 8, 9, 10 de 2026)
    DELETE FROM previsions WHERE annee = 2026 AND semaine IN (8, 9, 10);

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_projet_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- ─── Semaine 8 (passée) — quelques tâches avec 100% ───
        INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at)
        VALUES
        (v_projet_id, 8, 2026, 'Implantation et piquetage des axes', 'HEBDOMADAIRE', '2026-02-16', '2026-02-20', 100, NOW(), NOW()),
        (v_projet_id, 8, 2026, 'Approvisionnement en granulats 0/31.5', 'APPROVISIONNEMENT', '2026-02-16', '2026-02-20', 100, NOW(), NOW()),
        (v_projet_id, 8, 2026, 'Décapage et terrassement zone A', 'HEBDOMADAIRE', '2026-02-16', '2026-02-20', 85, NOW(), NOW());

        -- ─── Semaine 9 (semaine en cours) — tâches avec avancement variable ───
        INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at)
        VALUES
        (v_projet_id, 9, 2026, 'Terrassement et mise en forme plateforme — Tronçon 1', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 65, NOW(), NOW()),
        (v_projet_id, 9, 2026, 'Pose de bordures T2 côté droit PK 0+200 à PK 0+450', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 40, NOW(), NOW()),
        (v_projet_id, 9, 2026, 'Réception matériaux bitumineux (BB 0/10) — Lot 2', 'APPROVISIONNEMENT', '2026-02-23', '2026-02-27', 80, NOW(), NOW()),
        (v_projet_id, 9, 2026, 'Contrôle de compacité couche de fondation (essais Proctor)', 'HEBDOMADAIRE', '2026-02-24', '2026-02-25', 100, NOW(), NOW()),
        (v_projet_id, 9, 2026, 'Déplacement réseau AEP — coordination SEEG', 'HEBDOMADAIRE', '2026-02-23', '2026-02-27', 20, NOW(), NOW()),
        (v_projet_id, 9, 2026, 'Mise en place signalisation temporaire chantier', 'MATERIEL', '2026-02-23', '2026-02-23', 100, NOW(), NOW());

        -- ─── Semaine 10 (semaine suivante — prévisions) ───
        INSERT INTO previsions (projet_id, semaine, annee, description, type, date_debut, date_fin, avancement_pct, created_at, updated_at)
        VALUES
        (v_projet_id, 10, 2026, 'Compactage et réglage couche de base — Tronçon 1', 'HEBDOMADAIRE', '2026-03-02', '2026-03-06', NULL, NOW(), NOW()),
        (v_projet_id, 10, 2026, 'Pose de caniveaux béton — Section Nord PK 0+000 à PK 0+300', 'HEBDOMADAIRE', '2026-03-02', '2026-03-06', NULL, NOW(), NOW()),
        (v_projet_id, 10, 2026, 'Approvisionnement ciment CPA 45 — 120 tonnes', 'APPROVISIONNEMENT', '2026-03-02', '2026-03-04', NULL, NOW(), NOW()),
        (v_projet_id, 10, 2026, 'Mobilisation niveleuse et compacteur vibrant', 'MATERIEL', '2026-03-02', '2026-03-02', NULL, NOW(), NOW()),
        (v_projet_id, 10, 2026, 'Ferraillage dalot cadre 2x2 — PK 1+150', 'HEBDOMADAIRE', '2026-03-03', '2026-03-06', NULL, NOW(), NOW());

    END LOOP;

    CLOSE cur;
END //

DELIMITER ;

-- Exécuter la procédure
CALL insert_test_previsions();

-- Nettoyage
DROP PROCEDURE IF EXISTS insert_test_previsions;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. VÉRIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Nombre de prévisions par projet et par semaine
SELECT
    p.nom AS projet,
    pr.semaine,
    pr.annee,
    COUNT(*) AS nb_taches,
    ROUND(AVG(pr.avancement_pct), 0) AS avancement_moyen_pct
FROM previsions pr
JOIN projets p ON p.id = pr.projet_id
WHERE pr.annee = 2026
GROUP BY p.nom, pr.semaine, pr.annee
ORDER BY p.nom, pr.semaine;

-- Détail des prévisions de la semaine 9 (semaine en cours)
SELECT
    p.nom AS projet,
    pr.description AS tache,
    pr.type,
    pr.avancement_pct,
    pr.date_debut,
    pr.date_fin
FROM previsions pr
JOIN projets p ON p.id = pr.projet_id
WHERE pr.annee = 2026 AND pr.semaine = 9
ORDER BY p.nom, pr.avancement_pct DESC;

-- Détail des prévisions de la semaine 10 (semaine suivante)
SELECT
    p.nom AS projet,
    pr.description AS tache,
    pr.type,
    pr.avancement_pct,
    pr.date_debut,
    pr.date_fin
FROM previsions pr
JOIN projets p ON p.id = pr.projet_id
WHERE pr.annee = 2026 AND pr.semaine = 10
ORDER BY p.nom, pr.date_debut;
