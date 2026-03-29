package com.mikaservices.platform.modules.bareme.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.jdbc.core.JdbcTemplate

/**
 * PostgreSQL : si des colonnes texte du barème sont en **BYTEA**, elles sont converties en `text` au **démarrage**
 * (aucune action opérateur). Sinon Hibernate produit `lower(bytea)` et la base rejette la requête.
 *
 * Activé par défaut en prod PostgreSQL via `application-prod-postgres.yml` (`bareme.fix-pg-text-columns`).
 * Désactivation explicite : `bareme.fix-pg-text-columns=false` ou `BAREME_FIX_PG_TEXT_COLUMNS=false`.
 * Variable `BAREME_FIX_PG_TEXT_COLUMNS=true` force l’exécution si le YAML est absent (rétrocompatibilité).
 */
@Configuration
class BaremePostgresSchemaFixRunner {
    private val logger = LoggerFactory.getLogger(BaremePostgresSchemaFixRunner::class.java)

    private val allowedByteaTargets: List<Pair<String, Set<String>>> = listOf(
        "bareme_lignes_prix" to setOf(
            "libelle", "reference", "unite", "unite_prestation", "famille", "categorie", "depot",
            "date_prix", "code_fournisseur", "ref_reception", "contact_texte",
        ),
        "bareme_fournisseurs" to setOf("nom", "contact"),
        "bareme_corps_etat" to setOf("code", "libelle"),
    )

    @Bean
    fun runBaremePostgresSchemaFixIfEnabled(
        jdbcTemplate: JdbcTemplate,
        env: Environment,
        @Value("\${bareme.fix-pg-text-columns:false}") yamlFlag: Boolean,
    ): ApplicationRunner {
        return ApplicationRunner {
            val legacyEnv = env.getProperty("BAREME_FIX_PG_TEXT_COLUMNS")?.equals("true", ignoreCase = true) == true
            val disabledExplicitly =
                env.getProperty("BAREME_FIX_PG_TEXT_COLUMNS")?.equals("false", ignoreCase = true) == true ||
                    env.getProperty("bareme.fix-pg-text-columns")?.equals("false", ignoreCase = true) == true
            if (disabledExplicitly) return@ApplicationRunner
            if (!yamlFlag && !legacyEnv) return@ApplicationRunner

            val driver = env.getProperty("spring.datasource.driver-class-name") ?: ""
            if (!driver.contains("postgresql", ignoreCase = true)) {
                logger.debug("Barème BYTEA→TEXT : ignoré (driver non PostgreSQL : {})", driver)
                return@ApplicationRunner
            }

            logger.warn("Barème PostgreSQL : correction BYTEA→TEXT sur colonnes texte (si besoin)")
            var altered = 0
            for ((table, columns) in allowedByteaTargets) {
                val byteaCols = jdbcTemplate.query(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = ? AND data_type = 'bytea'
                    """.trimIndent(),
                    { rs, _ -> rs.getString(1) },
                    table,
                ).filter { it in columns }

                for (col in byteaCols) {
                    val sql =
                        """ALTER TABLE "$table" ALTER COLUMN "$col" TYPE text USING convert_from("$col", 'UTF8')"""
                    try {
                        jdbcTemplate.execute(sql)
                        altered++
                        logger.warn("Barème : colonne {}.{} convertie BYTEA → text (UTF-8)", table, col)
                    } catch (e: Exception) {
                        logger.error("Barème : conversion automatique BYTEA→text impossible pour {}.{}", table, col, e)
                    }
                }
            }
            if (altered == 0) {
                logger.info("Barème PostgreSQL : aucune colonne BYTEA à corriger (tables à jour)")
            }
        }
    }
}
