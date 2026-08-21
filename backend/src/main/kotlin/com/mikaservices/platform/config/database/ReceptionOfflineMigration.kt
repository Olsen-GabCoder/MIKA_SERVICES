package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : colonnes de reception offline sur mouvements_engin.
 * Idempotent : ignore si les colonnes existent deja.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ReceptionOfflineMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(ReceptionOfflineMigration::class.java)

    @PostConstruct
    fun migrate() {
        val cols = mapOf(
            "date_reception_terrain" to "TIMESTAMP",
            "date_synchronisation" to "TIMESTAMP",
            "sync_differee" to "BOOLEAN DEFAULT FALSE",
        )
        for ((col, type) in cols) {
            try {
                jdbcTemplate.execute("ALTER TABLE mouvements_engin ADD COLUMN $col $type")
                logger.info("[ReceptionOffline] Colonne $col ajoutee.")
            } catch (e: Exception) {
                logger.warn("[ReceptionOffline] Colonne $col deja presente : ${e.message}")
            }
        }
    }
}
