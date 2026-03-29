package com.mikaservices.platform.modules.bareme.config

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.core.env.Environment
import org.springframework.jdbc.core.JdbcTemplate

/**
 * PostgreSQL : colonnes **BYTEA** sur les tables barème → `text`, sinon Hibernate génère `lower(bytea)` (erreur 500).
 *
 * Détection par `spring.datasource.url` ou `DATABASE_URL` (compatible Render sans profil `prod-postgres`).
 * Toute colonne `bytea` est traitée sauf identifiants / numériques / dates / booléen métier.
 *
 * Plusieurs stratégies `USING` sont essayées (UTF-8, LATIN1, puis `encode(..., 'escape')`).
 *
 * Désactivation : `bareme.fix-pg-text-columns=false` ou `BAREME_FIX_PG_TEXT_COLUMNS=false`.
 */
@Configuration
class BaremePostgresSchemaFixRunner {
    private val logger = LoggerFactory.getLogger(BaremePostgresSchemaFixRunner::class.java)

    /** Colonnes à ne jamais forcer en `text` (types non texte côté métier). */
    private val excludeByteaConversionByTable: Map<String, Set<String>> = mapOf(
        "bareme_lignes_prix" to setOf(
            "id",
            "corps_etat_id",
            "fournisseur_bareme_id",
            "parent_id",
            "ordre_ligne",
            "numero_ligne_excel",
            "prix_ttc",
            "quantite",
            "prix_unitaire",
            "somme",
            "debourse",
            "prix_vente",
            "coefficient_pv",
            "prix_estime",
            "created_at",
            "updated_at",
        ),
        "bareme_fournisseurs" to setOf("id", "created_at", "updated_at"),
        "bareme_corps_etat" to setOf("id", "ordre_affichage", "created_at", "updated_at"),
    )

    private fun isPostgresqlUrl(env: Environment): Boolean {
        val jdbc = env.getProperty("spring.datasource.url").orEmpty().lowercase()
        val dbUrl = env.getProperty("DATABASE_URL").orEmpty().lowercase()
        return jdbc.contains("postgresql") ||
            dbUrl.startsWith("postgresql://") ||
            dbUrl.startsWith("postgres://") ||
            dbUrl.contains("jdbc:postgresql")
    }

    /**
     * Tente ALTER ... TYPE text USING &lt;stratégie&gt; jusqu’à succès.
     * @return true si la colonne a été convertie
     */
    private fun tryAlterByteaToText(jdbcTemplate: JdbcTemplate, table: String, col: String): Boolean {
        val qCol = "\"$col\""
        val strategies = listOf(
            "convert_from($qCol, 'UTF8')" to "UTF-8",
            "convert_from($qCol, 'LATIN1')" to "LATIN1",
            "encode($qCol, 'escape')" to "encode_escape",
        )
        for ((usingExpr, label) in strategies) {
            val sql = """ALTER TABLE "$table" ALTER COLUMN "$col" TYPE text USING $usingExpr"""
            try {
                jdbcTemplate.execute(sql)
                logger.warn("Barème : {}.{} BYTEA → text ({})", table, col, label)
                return true
            } catch (e: Exception) {
                logger.debug("Barème : {}.{} — stratégie {} ignorée : {}", table, col, label, e.message)
            }
        }
        logger.error("Barème : {}.{} — toutes les stratégies BYTEA→text ont échoué", table, col)
        return false
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    fun runBaremePostgresSchemaFixIfEnabled(
        jdbcTemplate: JdbcTemplate,
        env: Environment,
    ): ApplicationRunner {
        return ApplicationRunner {
            val disabledExplicitly =
                env.getProperty("BAREME_FIX_PG_TEXT_COLUMNS")?.equals("false", ignoreCase = true) == true ||
                    env.getProperty("bareme.fix-pg-text-columns")?.equals("false", ignoreCase = true) == true
            if (disabledExplicitly) {
                logger.info("Barème BYTEA→TEXT : désactivé explicitement")
                return@ApplicationRunner
            }
            val pg = isPostgresqlUrl(env)
            val jdbcHint = env.getProperty("spring.datasource.url")?.let { u ->
                if (u.length > 40) u.take(12) + "…" + u.takeLast(28) else u
            } ?: "(non défini)"
            if (!pg) {
                logger.debug(
                    "Barème BYTEA→TEXT : ignoré (pas d’URL PostgreSQL). spring.datasource.url={}, DATABASE_URL défini={}",
                    jdbcHint,
                    env.getProperty("DATABASE_URL") != null,
                )
                return@ApplicationRunner
            }

            logger.warn(
                "Barème PostgreSQL : scan BYTEA→text (jdbc.url hint={}, DATABASE_URL présent={})",
                jdbcHint,
                env.getProperty("DATABASE_URL") != null,
            )
            var altered = 0
            for ((table, exclude) in excludeByteaConversionByTable) {
                val placeholders = exclude.map { "?" }.joinToString(",")
                val args: Array<Any> = listOf<Any>(table).plus(exclude).toTypedArray()
                val byteaCols = jdbcTemplate.queryForList(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = ? AND data_type = 'bytea'
                    AND column_name NOT IN ($placeholders)
                    ORDER BY column_name
                    """.trimIndent(),
                    *args,
                ).mapNotNull { row -> (row["column_name"] ?: row["COLUMN_NAME"])?.toString() }

                if (byteaCols.isEmpty()) continue

                logger.warn("Barème : table {} — {} colonne(s) en BYTEA détectée(s) : {}", table, byteaCols.size, byteaCols)
                for (col in byteaCols) {
                    if (tryAlterByteaToText(jdbcTemplate, table, col)) {
                        altered++
                    }
                }
            }
            if (altered == 0) {
                logger.info("Barème PostgreSQL : aucune colonne BYTEA à convertir (schéma déjà texte ou tables absentes)")
            } else {
                logger.warn("Barème PostgreSQL : {} colonne(s) convertie(s) BYTEA → text", altered)
            }
        }
    }
}
