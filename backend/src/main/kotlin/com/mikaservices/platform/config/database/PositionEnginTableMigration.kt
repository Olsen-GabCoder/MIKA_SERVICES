package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration : crée la table positions_engin (prod : ddl-auto=none).
 * Idempotent : CREATE TABLE IF NOT EXISTS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class PositionEnginTableMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(PositionEnginTableMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            jdbcTemplate.execute(
                """
                CREATE TABLE IF NOT EXISTS positions_engin (
                    id BIGSERIAL PRIMARY KEY,
                    engin_id BIGINT NOT NULL REFERENCES engins(id),
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    source VARCHAR(20) NOT NULL DEFAULT 'MANUEL',
                    precision_metres INTEGER,
                    chantier_nom VARCHAR(300),
                    confirme_par VARCHAR(200),
                    horodatage TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    created_by VARCHAR(100),
                    updated_by VARCHAR(100)
                )
                """.trimIndent()
            )
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_position_engin ON positions_engin (engin_id)")
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_position_horodatage ON positions_engin (horodatage)")
            logger.info("[PositionEnginTable] Table positions_engin prête.")
        } catch (e: Exception) {
            logger.error("[PositionEnginTable] ERREUR : ${e.message}", e)
        }
    }
}
