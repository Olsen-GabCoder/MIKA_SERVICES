package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : ajoute les colonnes chantier_actif, motif_arret_chantier,
 * detail_arret_chantier, date_arret_chantier sur la table projets.
 * Idempotent : ne fait rien si les colonnes existent déjà.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ChantierColumnsMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(ChantierColumnsMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            addColumnIfNotExists("projets", "chantier_actif", "BOOLEAN DEFAULT true NOT NULL")
            addColumnIfNotExists("projets", "motif_arret_chantier", "VARCHAR(50)")
            addColumnIfNotExists("projets", "detail_arret_chantier", "TEXT")
            addColumnIfNotExists("projets", "date_arret_chantier", "DATE")
            logger.info("[ChantierColumnsMigration] Migration terminee.")
        } catch (e: Exception) {
            logger.error("[ChantierColumnsMigration] ERREUR : ${e.message}", e)
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
                logger.warn("[ChantierColumnsMigration] Colonne $table.$column ajoutee ($type).")
            } else {
                logger.info("[ChantierColumnsMigration] Colonne $table.$column existe deja.")
            }
        } catch (e: Exception) {
            logger.warn("[ChantierColumnsMigration] Erreur ajout $table.$column : ${e.message}")
        }
    }
}
