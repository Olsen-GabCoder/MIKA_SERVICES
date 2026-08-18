package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : fusionne les previsions dans la table taches.
 * Ajoute les colonnes semaine, annee, type_prevision sur taches,
 * puis copie les donnees de la table previsions (sans doublons).
 * Idempotent : ne fait rien si deja execute.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class TachePrevisionFusionMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(TachePrevisionFusionMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            addColumnIfNotExists("taches", "semaine", "INT")
            addColumnIfNotExists("taches", "annee", "INT")
            addColumnIfNotExists("taches", "type_prevision", "VARCHAR(30)")

            migratePrevisionData()

            logger.info("[TachePrevisionFusion] Migration terminee.")
        } catch (e: Exception) {
            logger.error("[TachePrevisionFusion] ERREUR : ${e.message}", e)
        }
    }

    private fun migratePrevisionData() {
        try {
            // Migration deja jouee et scellee : la table legacy a ete renommee en backup.
            // Ce garde-fou empeche la re-insertion de taches supprimees par l'utilisateur
            // a chaque redemarrage (bug des "taches ressuscitees").
            val backupExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'previsions_legacy_backup'",
                Int::class.java
            ) ?: 0
            if (backupExists > 0) {
                logger.info("[TachePrevisionFusion] Migration deja scellee (previsions_legacy_backup presente), rien a faire.")
                return
            }

            // Verifier que la table previsions existe
            val tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'previsions'",
                Int::class.java
            ) ?: 0
            if (tableExists == 0) {
                logger.info("[TachePrevisionFusion] Table previsions inexistante, rien a migrer.")
                return
            }

            // Compter les previsions non encore migrees
            // On insere uniquement les previsions qui n'ont pas deja de tache correspondante
            // (meme projet + meme description/titre + meme semaine + meme annee)
            val count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM previsions p
                WHERE NOT EXISTS (
                    SELECT 1 FROM taches t
                    WHERE t.projet_id = p.projet_id
                    AND t.type_prevision IS NOT NULL
                    AND t.semaine IS NOT DISTINCT FROM p.semaine
                    AND t.annee IS NOT DISTINCT FROM p.annee
                    AND t.titre = COALESCE(p.description, 'Prevision S' || p.semaine || '/' || p.annee)
                )
                """.trimIndent(),
                Int::class.java
            ) ?: 0

            if (count == 0) {
                logger.info("[TachePrevisionFusion] Aucune prevision a migrer (deja fait ou table vide).")
                sealMigration()
                return
            }

            // Migrer les previsions en taches
            val inserted = jdbcTemplate.update(
                """
                INSERT INTO taches (projet_id, titre, description, statut, priorite,
                    date_debut, date_fin, pourcentage_avancement,
                    semaine, annee, type_prevision, created_at, updated_at)
                SELECT
                    p.projet_id,
                    COALESCE(p.description, 'Prevision S' || p.semaine || '/' || p.annee),
                    p.description,
                    CASE
                        WHEN COALESCE(p.avancement_pct, 0) >= 100 THEN 'TERMINEE'
                        WHEN COALESCE(p.avancement_pct, 0) > 0 THEN 'EN_COURS'
                        ELSE 'A_FAIRE'
                    END,
                    'NORMALE',
                    p.date_debut,
                    p.date_fin,
                    COALESCE(p.avancement_pct, 0),
                    p.semaine,
                    p.annee,
                    p.type,
                    COALESCE(p.created_at, NOW()),
                    COALESCE(p.updated_at, NOW())
                FROM previsions p
                WHERE NOT EXISTS (
                    SELECT 1 FROM taches t
                    WHERE t.projet_id = p.projet_id
                    AND t.type_prevision IS NOT NULL
                    AND t.semaine IS NOT DISTINCT FROM p.semaine
                    AND t.annee IS NOT DISTINCT FROM p.annee
                    AND t.titre = COALESCE(p.description, 'Prevision S' || p.semaine || '/' || p.annee)
                )
                """.trimIndent()
            )

            logger.warn("[TachePrevisionFusion] $inserted previsions migrees vers taches.")
            sealMigration()
        } catch (e: Exception) {
            logger.warn("[TachePrevisionFusion] Erreur migration donnees : ${e.message}")
        }
    }

    /**
     * Scelle la migration en renommant la table legacy (aucune perte de donnees).
     * Sans ce scellement, chaque redemarrage re-inserait les previsions dont la tache
     * correspondante a ete supprimee par l'utilisateur.
     */
    private fun sealMigration() {
        try {
            jdbcTemplate.execute("ALTER TABLE previsions RENAME TO previsions_legacy_backup")
            logger.warn("[TachePrevisionFusion] Table previsions renommee en previsions_legacy_backup (migration scellee).")
        } catch (e: Exception) {
            logger.warn("[TachePrevisionFusion] Erreur scellement (rename previsions) : ${e.message}")
        }
    }

    private fun addColumnIfNotExists(table: String, column: String, type: String) {
        try {
            val exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
                Int::class.java, table, column
            ) ?: 0
            if (exists == 0) {
                jdbcTemplate.execute("ALTER TABLE $table ADD COLUMN $column $type")
                logger.warn("[TachePrevisionFusion] Colonne $table.$column ajoutee ($type).")
            }
        } catch (e: Exception) {
            logger.warn("[TachePrevisionFusion] Erreur ajout $table.$column : ${e.message}")
        }
    }
}
