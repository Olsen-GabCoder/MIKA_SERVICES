package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration workflow de transfert d'engins (validation logistique + QR de réception) :
 * - nouvelles colonnes sur mouvements_engin (qr_token, code_reception, validation, réception GPS/réserves)
 * - suppression des contraintes CHECK Postgres sur les colonnes enum étendues
 *   (statut : + DEMANDE/REJETE ; type_evenement : + DEMANDE_CREEE/VALIDATION/REJET/RECEPTION_RESERVES).
 * Idempotent, compatible Postgres prod (ddl-auto none) / MySQL dev (ddl-auto update).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class TransfertWorkflowMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(TransfertWorkflowMigration::class.java)

    private val columns = listOf(
        "qr_token" to "VARCHAR(64)",
        "code_reception" to "VARCHAR(6)",
        "valide_par" to "VARCHAR(150)",
        "date_validation" to "TIMESTAMP",
        "motif_rejet" to "TEXT",
        "reception_avec_reserves" to "BOOLEAN",
        "reception_par_code_manuel" to "BOOLEAN",
        "reception_latitude" to "DOUBLE PRECISION",
        "reception_longitude" to "DOUBLE PRECISION",
        "reception_precision_metres" to "DOUBLE PRECISION",
        "incident_reception_id" to "BIGINT",
    )

    @PostConstruct
    fun migrate() {
        for ((name, type) in columns) addColumnIfNotExists("mouvements_engin", name, type)
        // Booléens non-null côté entité : rétro-remplir les lignes existantes (NULL → primitive = 500).
        for (col in listOf("reception_avec_reserves", "reception_par_code_manuel")) {
            try {
                jdbcTemplate.update("UPDATE mouvements_engin SET $col = FALSE WHERE $col IS NULL")
            } catch (e: Exception) {
                logger.warn("[TransfertWorkflowMigration] Backfill $col ignore : ${e.message}")
            }
        }
        try {
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_mouvements_engin_qr_token ON mouvements_engin (qr_token)")
        } catch (e: Exception) {
            logger.warn("[TransfertWorkflowMigration] Erreur index qr_token : ${e.message}")
        }
        // Enums étendus : les CHECK Postgres générés par Hibernate refuseraient les nouvelles valeurs.
        dropCheckConstraints("mouvements_engin", "statut")
        dropCheckConstraints("mouvements_engin_evenements", "type_evenement")
        dropCheckConstraints("notifications", "type_notification")
        logger.info("[TransfertWorkflowMigration] Migration terminee.")
    }

    private fun addColumnIfNotExists(table: String, column: String, type: String) {
        try {
            val exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
                Int::class.java, table, column
            ) ?: 0
            if (exists == 0) {
                jdbcTemplate.execute("ALTER TABLE $table ADD COLUMN $column $type")
                logger.warn("[TransfertWorkflowMigration] Colonne $table.$column ajoutee.")
            }
        } catch (e: Exception) {
            logger.warn("[TransfertWorkflowMigration] Erreur ajout colonne $table.$column : ${e.message}")
        }
    }

    /** Supprime toute contrainte CHECK Postgres portant sur la colonne (noms générés par Hibernate). */
    private fun dropCheckConstraints(table: String, column: String) {
        try {
            val names = jdbcTemplate.queryForList(
                """
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name AND ccu.table_name = tc.table_name
                WHERE tc.table_name = ? AND tc.constraint_type = 'CHECK' AND ccu.column_name = ?
                """.trimIndent(),
                String::class.java, table, column
            )
            for (name in names) {
                jdbcTemplate.execute("ALTER TABLE $table DROP CONSTRAINT IF EXISTS \"$name\"")
                logger.warn("[TransfertWorkflowMigration] Contrainte CHECK $name supprimee sur $table.$column.")
            }
        } catch (e: Exception) {
            // MySQL dev : requête/DDL peut différer — sans conséquence (ddl-auto update gère le schéma).
            logger.warn("[TransfertWorkflowMigration] Drop CHECK $table.$column ignore : ${e.message}")
        }
    }
}
