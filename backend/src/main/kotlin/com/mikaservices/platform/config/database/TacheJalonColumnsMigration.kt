package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : ajoute les colonnes est_jalon, couleur, ordre_affichage sur taches.
 * Idempotent : ne fait rien si deja execute.
 * est_jalon a un DEFAULT false pour ne pas echouer sur les lignes existantes.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class TacheJalonColumnsMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(TacheJalonColumnsMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            addColumnIfNotExists("taches", "est_jalon", "BOOLEAN NOT NULL DEFAULT false")
            addColumnIfNotExists("taches", "couleur", "VARCHAR(7)")
            addColumnIfNotExists("taches", "ordre_affichage", "INT")
            logger.info("[TacheJalonColumns] Migration terminee.")
        } catch (e: Exception) {
            logger.error("[TacheJalonColumns] ERREUR : ${e.message}", e)
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
                logger.warn("[TacheJalonColumns] Colonne $table.$column ajoutee ($type).")
            }
        } catch (e: Exception) {
            logger.warn("[TacheJalonColumns] Erreur ajout $table.$column : ${e.message}")
        }
    }
}
