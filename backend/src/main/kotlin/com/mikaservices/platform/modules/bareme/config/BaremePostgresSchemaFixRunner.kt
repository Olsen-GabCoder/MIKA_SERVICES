package com.mikaservices.platform.modules.bareme.config

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.jdbc.core.JdbcTemplate

/**
 * PostgreSQL : si des colonnes texte du barème sont en **BYTEA**, elles sont converties en `text` au **démarrage**.
 * Détection **par URL** (`spring.datasource.url` ou `DATABASE_URL`) : pas besoin du profil `prod-postgres`
 * pour activer ce correctif (Render peut n’exposer que `prod` + `DATABASE_URL=postgresql://...`).
 *
 * Désactivation explicite : `bareme.fix-pg-text-columns=false` ou `BAREME_FIX_PG_TEXT_COLUMNS=false`.
 */
@Configuration
class BaremePostgresSchemaFixRunner {
    private val logger = LoggerFactory.getLogger(BaremePostgresSchemaFixRunner::class.java)

    private fun isPostgresqlUrl(env: Environment): Boolean {
        val jdbc = env.getProperty("spring.datasource.url").orEmpty().lowercase()
        val dbUrl = env.getProperty("DATABASE_URL").orEmpty().lowercase()
        return jdbc.contains("postgresql") ||
            dbUrl.startsWith("postgresql://") ||
            dbUrl.startsWith("postgres://") ||
            dbUrl.contains("jdbc:postgresql")
    }

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
    ): ApplicationRunner {
        return ApplicationRunner {
            val disabledExplicitly =
                env.getProperty("BAREME_FIX_PG_TEXT_COLUMNS")?.equals("false", ignoreCase = true) == true ||
                    env.getProperty("bareme.fix-pg-text-columns")?.equals("false", ignoreCase = true) == true
            if (disabledExplicitly) return@ApplicationRunner
            if (!isPostgresqlUrl(env)) {
                logger.debug("Barème BYTEA→TEXT : ignoré (aucune URL PostgreSQL dans spring.datasource.url / DATABASE_URL)")
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
