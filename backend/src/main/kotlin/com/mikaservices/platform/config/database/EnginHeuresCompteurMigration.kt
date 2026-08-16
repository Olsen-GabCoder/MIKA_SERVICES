package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : met a jour les heures_compteur NULL en 0 et ajoute NOT NULL DEFAULT 0.
 * Idempotent : UPDATE WHERE NULL ne touche rien si deja fait.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class EnginHeuresCompteurMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(EnginHeuresCompteurMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            val updated = jdbcTemplate.update("UPDATE engins SET heures_compteur = 0 WHERE heures_compteur IS NULL")
            if (updated > 0) {
                logger.info("[EnginHeuresCompteur] $updated engin(s) mis a jour (NULL -> 0)")
            }
            try {
                jdbcTemplate.execute("ALTER TABLE engins ALTER COLUMN heures_compteur SET NOT NULL")
                jdbcTemplate.execute("ALTER TABLE engins ALTER COLUMN heures_compteur SET DEFAULT 0")
                logger.info("[EnginHeuresCompteur] Contrainte NOT NULL DEFAULT 0 appliquee.")
            } catch (e: Exception) {
                logger.warn("[EnginHeuresCompteur] Contrainte deja en place ou non supportee : ${e.message}")
            }
        } catch (e: Exception) {
            logger.error("[EnginHeuresCompteur] ERREUR : ${e.message}", e)
        }
    }
}
