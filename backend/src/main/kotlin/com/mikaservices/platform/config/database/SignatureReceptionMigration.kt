package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : ajoute la colonne signature_reception_url (TEXT) sur mouvements_engin.
 * Idempotent : ignore si la colonne existe deja.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class SignatureReceptionMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(SignatureReceptionMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            jdbcTemplate.execute("ALTER TABLE mouvements_engin ADD COLUMN signature_reception_url TEXT")
            logger.info("[SignatureReception] Colonne signature_reception_url ajoutee.")
        } catch (e: Exception) {
            logger.warn("[SignatureReception] Colonne deja presente ou erreur : ${e.message}")
        }
    }
}
