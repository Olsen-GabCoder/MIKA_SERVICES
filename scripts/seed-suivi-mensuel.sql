-- ============================================================
-- Script : Remplir le CA previsionnel pour les projets existants
-- Base   : mika_services_dev (MySQL)
-- Usage  : mysql -u root -p mika_services_dev < seed-suivi-mensuel.sql
-- ============================================================
-- Strategie :
--   1. Pour chaque projet ayant des lignes CA avec ca_previsionnel = 0,
--      repartir le montant_ht en courbe en cloche sur les mois existants.
--   2. Pour les projets sans aucune ligne CA (29, 30, 31), inserer les mois.
--   3. Recalculer ecart + avancement_cumule sur toutes les lignes.
-- ============================================================

-- ── ETAPE 1 : Procedure pour repartir le budget en cloche ────

DROP PROCEDURE IF EXISTS fill_ca_previsionnel;

DELIMITER //
CREATE PROCEDURE fill_ca_previsionnel()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_projet_id BIGINT;
    DECLARE v_montant_ht DECIMAL(20,2);
    DECLARE v_nb_mois INT;
    DECLARE v_total_poids DECIMAL(20,4);
    DECLARE v_rang INT;
    DECLARE v_poids DECIMAL(20,4);
    DECLARE v_ca DECIMAL(20,2);
    DECLARE v_ca_id BIGINT;
    DECLARE v_cumul_diff DECIMAL(20,2);

    -- Curseur : projets ayant des lignes CA avec previsionnel = 0 et un montant_ht > 0
    DECLARE cur_projets CURSOR FOR
        SELECT DISTINCT p.id, p.montant_ht
        FROM projets p
        JOIN ca_previsionnel_realise c ON c.projet_id = p.id
        WHERE p.actif = 1
          AND p.montant_ht IS NOT NULL
          AND p.montant_ht > 0
          AND NOT EXISTS (
              SELECT 1 FROM ca_previsionnel_realise c2
              WHERE c2.projet_id = p.id AND c2.ca_previsionnel > 0
          );
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_projets;

    projet_loop: LOOP
        FETCH cur_projets INTO v_projet_id, v_montant_ht;
        IF done THEN LEAVE projet_loop; END IF;

        -- Nombre de mois pour ce projet
        SELECT COUNT(*) INTO v_nb_mois
        FROM ca_previsionnel_realise WHERE projet_id = v_projet_id;

        IF v_nb_mois = 0 THEN ITERATE projet_loop; END IF;

        -- Calculer les poids en cloche : poids = sin(pi * rang / (nb_mois + 1))
        -- D'abord calculer la somme des poids
        SET v_total_poids = 0;
        SET v_rang = 0;

        BEGIN
            DECLARE inner_done INT DEFAULT 0;
            DECLARE v_inner_id BIGINT;
            DECLARE cur_mois CURSOR FOR
                SELECT id FROM ca_previsionnel_realise
                WHERE projet_id = v_projet_id
                ORDER BY annee, mois;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET inner_done = 1;

            OPEN cur_mois;
            calc_loop: LOOP
                FETCH cur_mois INTO v_inner_id;
                IF inner_done THEN LEAVE calc_loop; END IF;
                SET v_rang = v_rang + 1;
                SET v_total_poids = v_total_poids + SIN(PI() * v_rang / (v_nb_mois + 1));
            END LOOP;
            CLOSE cur_mois;
        END;

        -- Appliquer les poids pour repartir le montant_ht
        SET v_rang = 0;
        SET v_cumul_diff = 0;

        BEGIN
            DECLARE inner_done2 INT DEFAULT 0;
            DECLARE v_inner_id2 BIGINT;
            DECLARE cur_mois2 CURSOR FOR
                SELECT id FROM ca_previsionnel_realise
                WHERE projet_id = v_projet_id
                ORDER BY annee, mois;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET inner_done2 = 1;

            OPEN cur_mois2;
            update_loop: LOOP
                FETCH cur_mois2 INTO v_inner_id2;
                IF inner_done2 THEN LEAVE update_loop; END IF;
                SET v_rang = v_rang + 1;
                SET v_poids = SIN(PI() * v_rang / (v_nb_mois + 1));
                SET v_ca = ROUND(v_montant_ht * v_poids / v_total_poids, 2);
                SET v_cumul_diff = v_cumul_diff + v_ca;

                -- Dernier mois : ajuster pour que le total = montant_ht exactement
                IF v_rang = v_nb_mois THEN
                    SET v_ca = v_ca + (v_montant_ht - v_cumul_diff);
                END IF;

                UPDATE ca_previsionnel_realise SET ca_previsionnel = v_ca WHERE id = v_inner_id2;
            END LOOP;
            CLOSE cur_mois2;
        END;

    END LOOP;
    CLOSE cur_projets;
END //
DELIMITER ;

CALL fill_ca_previsionnel();
DROP PROCEDURE IF EXISTS fill_ca_previsionnel;


-- ── ETAPE 2 : Inserer les mois manquants pour projets sans aucune ligne CA ──

-- Procedure pour generer les mois entre date_debut et date_fin
DROP PROCEDURE IF EXISTS insert_missing_ca_months;

DELIMITER //
CREATE PROCEDURE insert_missing_ca_months()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_projet_id BIGINT;
    DECLARE v_montant_ht DECIMAL(20,2);
    DECLARE v_date_debut DATE;
    DECLARE v_date_fin DATE;
    DECLARE v_current DATE;
    DECLARE v_nb_mois INT;
    DECLARE v_rang INT;
    DECLARE v_total_poids DECIMAL(20,4);
    DECLARE v_poids DECIMAL(20,4);
    DECLARE v_ca DECIMAL(20,2);
    DECLARE v_cumul DECIMAL(20,2);

    DECLARE cur_projets CURSOR FOR
        SELECT p.id, p.montant_ht, p.date_debut, p.date_fin
        FROM projets p
        WHERE p.actif = 1
          AND p.montant_ht IS NOT NULL AND p.montant_ht > 0
          AND p.date_debut IS NOT NULL AND p.date_fin IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM ca_previsionnel_realise c WHERE c.projet_id = p.id);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_projets;
    projet_loop: LOOP
        FETCH cur_projets INTO v_projet_id, v_montant_ht, v_date_debut, v_date_fin;
        IF done THEN LEAVE projet_loop; END IF;

        -- Compter les mois
        SET v_nb_mois = TIMESTAMPDIFF(MONTH, DATE_FORMAT(v_date_debut, '%Y-%m-01'), DATE_FORMAT(v_date_fin, '%Y-%m-01')) + 1;
        IF v_nb_mois < 1 THEN SET v_nb_mois = 1; END IF;

        -- Somme des poids cloche
        SET v_total_poids = 0;
        SET v_rang = 0;
        WHILE v_rang < v_nb_mois DO
            SET v_rang = v_rang + 1;
            SET v_total_poids = v_total_poids + SIN(PI() * v_rang / (v_nb_mois + 1));
        END WHILE;

        -- Inserer les mois
        SET v_current = DATE_FORMAT(v_date_debut, '%Y-%m-01');
        SET v_rang = 0;
        SET v_cumul = 0;
        WHILE v_current <= DATE_FORMAT(v_date_fin, '%Y-%m-01') DO
            SET v_rang = v_rang + 1;
            SET v_poids = SIN(PI() * v_rang / (v_nb_mois + 1));
            SET v_ca = ROUND(v_montant_ht * v_poids / v_total_poids, 2);
            SET v_cumul = v_cumul + v_ca;

            IF v_rang = v_nb_mois THEN
                SET v_ca = v_ca + (v_montant_ht - v_cumul);
            END IF;

            INSERT INTO ca_previsionnel_realise (projet_id, mois, annee, ca_previsionnel, ca_realise, ecart, avancement_cumule, created_at, updated_at)
            VALUES (v_projet_id, MONTH(v_current), YEAR(v_current), v_ca, 0, -v_ca, 0, NOW(), NOW());

            SET v_current = DATE_ADD(v_current, INTERVAL 1 MONTH);
        END WHILE;
    END LOOP;
    CLOSE cur_projets;
END //
DELIMITER ;

CALL insert_missing_ca_months();
DROP PROCEDURE IF EXISTS insert_missing_ca_months;


-- ── ETAPE 3 : Recalculer ecart + avancement cumule pour toutes les lignes ──

-- Ecart = realise - previsionnel (simple UPDATE global)
UPDATE ca_previsionnel_realise
SET ecart = ca_realise - ca_previsionnel;

-- Avancement cumule par projet : cumul_realise / budget * 100
DROP PROCEDURE IF EXISTS recalc_avancement;

DELIMITER //
CREATE PROCEDURE recalc_avancement()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_projet_id BIGINT;
    DECLARE v_montant_ht DECIMAL(20,2);
    DECLARE v_cumul DECIMAL(20,2);
    DECLARE v_ca_id BIGINT;
    DECLARE v_ca_realise DECIMAL(20,2);

    DECLARE cur_projets CURSOR FOR
        SELECT DISTINCT c.projet_id, COALESCE(p.montant_revise, p.montant_ht, 0)
        FROM ca_previsionnel_realise c
        JOIN projets p ON p.id = c.projet_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_projets;
    projet_loop: LOOP
        FETCH cur_projets INTO v_projet_id, v_montant_ht;
        IF done THEN LEAVE projet_loop; END IF;

        SET v_cumul = 0;

        BEGIN
            DECLARE inner_done INT DEFAULT 0;
            DECLARE v_row_id BIGINT;
            DECLARE v_row_realise DECIMAL(20,2);
            DECLARE cur_rows CURSOR FOR
                SELECT id, ca_realise FROM ca_previsionnel_realise
                WHERE projet_id = v_projet_id ORDER BY annee, mois;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET inner_done = 1;

            OPEN cur_rows;
            row_loop: LOOP
                FETCH cur_rows INTO v_row_id, v_row_realise;
                IF inner_done THEN LEAVE row_loop; END IF;
                SET v_cumul = v_cumul + v_row_realise;
                UPDATE ca_previsionnel_realise
                SET avancement_cumule = IF(v_montant_ht > 0, ROUND(v_cumul / v_montant_ht * 100, 2), 0)
                WHERE id = v_row_id;
            END LOOP;
            CLOSE cur_rows;
        END;

    END LOOP;
    CLOSE cur_projets;
END //
DELIMITER ;

CALL recalc_avancement();
DROP PROCEDURE IF EXISTS recalc_avancement;


-- ── Verification ─────────────────────────────────────────────
SELECT
    p.id,
    SUBSTRING(p.nom, 1, 40) AS nom,
    COUNT(*) AS nb_mois,
    ROUND(SUM(c.ca_previsionnel)) AS total_prevu,
    ROUND(SUM(c.ca_realise)) AS total_realise,
    ROUND(SUM(c.ecart)) AS total_ecart
FROM ca_previsionnel_realise c
JOIN projets p ON p.id = c.projet_id
GROUP BY p.id, p.nom
ORDER BY p.id;
