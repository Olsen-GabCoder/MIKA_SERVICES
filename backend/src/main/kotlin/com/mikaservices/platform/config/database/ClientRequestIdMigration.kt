package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration Phase 3 offline-first (app terrain) : colonne client_request_id (idempotence)
 * sur les 7 tables cibles des POST terrain + index unique.
 * Idempotent : ne fait rien si colonne/index existent déjà. Compatible Postgres prod / MySQL dev.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ClientRequestIdMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(ClientRequestIdMigration::class.java)

    private val tables = listOf(
        "inspections_engin",
        "releves_compteur",
        "consommations_carburant",
        "incidents_engin",
        "positions_engin",
        "demandes_materiel",
        "mouvements_engin",
    )

    @PostConstruct
    fun migrate() {
        for (table in tables) {
            addColumnIfNotExists(table)
            createUniqueIndexIfNotExists(table)
        }
        logger.info("[ClientRequestIdMigration] Migration terminee.")
    }

    private fun addColumnIfNotExists(table: String) {
        try {
            val exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ? AND column_name = 'client_request_id'",
                Int::class.java, table
            ) ?: 0
            if (exists == 0) {
                jdbcTemplate.execute("ALTER TABLE $table ADD COLUMN client_request_id VARCHAR(36)")
                logger.warn("[ClientRequestIdMigration] Colonne $table.client_request_id ajoutee.")
            }
        } catch (e: Exception) {
            logger.warn("[ClientRequestIdMigration] Erreur ajout colonne $table : ${e.message}")
        }
    }

    private fun createUniqueIndexIfNotExists(table: String) {
        try {
            // Postgres supporte IF NOT EXISTS ; en dev MySQL, l'unicite JPA (ddl-auto=update) couvre deja.
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_${table}_client_request_id ON $table (client_request_id)")
        } catch (e: Exception) {
            logger.warn("[ClientRequestIdMigration] Erreur index unique $table : ${e.message}")
        }
    }
}
