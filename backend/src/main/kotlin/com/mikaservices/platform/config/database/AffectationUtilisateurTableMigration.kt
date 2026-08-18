package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : crée la table affectations_utilisateur_projet (prod : ddl-auto=none).
 * Idempotent : CREATE TABLE IF NOT EXISTS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class AffectationUtilisateurTableMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(AffectationUtilisateurTableMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            jdbcTemplate.execute(
                """
                CREATE TABLE IF NOT EXISTS affectations_utilisateur_projet (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id),
                    projet_id BIGINT NOT NULL REFERENCES projets(id),
                    poste VARCHAR(100) NOT NULL,
                    date_debut DATE NOT NULL,
                    date_fin DATE,
                    statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
                    observations TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    created_by VARCHAR(100),
                    updated_by VARCHAR(100)
                )
                """.trimIndent()
            )
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_affuser_user ON affectations_utilisateur_projet (user_id)")
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_affuser_projet ON affectations_utilisateur_projet (projet_id)")
            logger.info("[AffectationUtilisateurTable] Table affectations_utilisateur_projet prête.")
        } catch (e: Exception) {
            logger.error("[AffectationUtilisateurTable] ERREUR : ${e.message}", e)
        }
    }
}
