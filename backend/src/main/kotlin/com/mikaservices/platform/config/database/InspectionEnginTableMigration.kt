package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : crée la table inspections_engin (prod : ddl-auto=none).
 * Idempotent : CREATE TABLE IF NOT EXISTS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class InspectionEnginTableMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(InspectionEnginTableMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            jdbcTemplate.execute(
                """
                CREATE TABLE IF NOT EXISTS inspections_engin (
                    id BIGSERIAL PRIMARY KEY,
                    engin_id BIGINT NOT NULL REFERENCES engins(id),
                    date_inspection DATE NOT NULL,
                    inspecte_par VARCHAR(200),
                    compteur_heures INTEGER,
                    checklist_resultats TEXT,
                    etat_general VARCHAR(20) NOT NULL DEFAULT 'BON',
                    anomalies_detectees BOOLEAN NOT NULL DEFAULT FALSE,
                    commentaire TEXT,
                    signature TEXT,
                    incident_cree_id BIGINT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    created_by VARCHAR(100),
                    updated_by VARCHAR(100)
                )
                """.trimIndent()
            )
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_inspection_engin ON inspections_engin (engin_id)")
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_inspection_date ON inspections_engin (date_inspection)")
            logger.info("[InspectionEnginTable] Table inspections_engin prête.")
        } catch (e: Exception) {
            logger.error("[InspectionEnginTable] ERREUR : ${e.message}", e)
        }
    }
}
