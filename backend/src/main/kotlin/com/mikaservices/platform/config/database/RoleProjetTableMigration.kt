package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : crée la table roles_projet (prod : ddl-auto=none).
 * Idempotent : CREATE TABLE IF NOT EXISTS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RoleProjetTableMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(RoleProjetTableMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            jdbcTemplate.execute(
                """
                CREATE TABLE IF NOT EXISTS roles_projet (
                    id BIGSERIAL PRIMARY KEY,
                    code VARCHAR(50) NOT NULL UNIQUE,
                    nom VARCHAR(100) NOT NULL,
                    famille VARCHAR(30) NOT NULL,
                    cumulable BOOLEAN NOT NULL DEFAULT FALSE,
                    description VARCHAR(500),
                    actif BOOLEAN NOT NULL DEFAULT TRUE
                )
                """.trimIndent()
            )
            logger.info("[RoleProjetTable] Table roles_projet prête.")
        } catch (e: Exception) {
            logger.error("[RoleProjetTable] ERREUR : ${e.message}", e)
        }
    }
}
