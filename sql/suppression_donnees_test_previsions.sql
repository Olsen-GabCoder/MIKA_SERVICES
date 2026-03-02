-- =============================================================================
-- MIKA SERVICES — Suppression des données de test (prévisions semaine en cours)
-- À exécuter avant d'insérer les bonnes données.
-- Base : MySQL (mika_services_dev)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VÉRIFICATION : contenu actuel des prévisions (semaines 8, 9, 10 — 2026)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
    pr.id,
    p.code_projet,
    p.nom AS projet,
    pr.semaine,
    pr.annee,
    pr.description AS tache,
    pr.type,
    pr.avancement_pct,
    pr.date_debut,
    pr.date_fin
FROM previsions pr
JOIN projets p ON p.id = pr.projet_id
WHERE pr.annee = 2026 AND pr.semaine IN (8, 9, 10)
ORDER BY p.nom, pr.semaine, pr.id;

-- Nombre de lignes qui seront supprimées :
SELECT COUNT(*) AS nb_lignes_a_supprimer
FROM previsions
WHERE annee = 2026 AND semaine IN (8, 9, 10);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SUPPRESSION des prévisions de test (semaines 8, 9, 10 — année 2026)
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM previsions
WHERE annee = 2026 AND semaine IN (8, 9, 10);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VÉRIFICATION après suppression
-- ─────────────────────────────────────────────────────────────────────────────

SELECT COUNT(*) AS nb_previsions_restantes_2026_s8_s9_s10
FROM previsions
WHERE annee = 2026 AND semaine IN (8, 9, 10);
-- Doit retourner 0.

-- Aperçu des prévisions restantes (toutes périodes) :
SELECT annee, semaine, COUNT(*) AS nb_taches
FROM previsions
GROUP BY annee, semaine
ORDER BY annee, semaine;
