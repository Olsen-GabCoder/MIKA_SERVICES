package com.mikaservices.platform.modules.bareme.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.core.JdbcTemplate

/**
 * Correctif one-shot pour prod PostgreSQL:
 * certaines colonnes texte ont pu être créées en BYTEA dans une migration passée.
 *
 * Activation via variable d'env:
 * BAREME_FIX_PG_TEXT_COLUMNS=true
 */
@Configuration
class BaremePostgresSchemaFixRunner {
    private val logger = LoggerFactory.getLogger(BaremePostgresSchemaFixRunner::class.java)

    @Bean
    fun runBaremePostgresSchemaFixIfEnabled(
        jdbcTemplate: JdbcTemplate,
        @Value("\${BAREME_FIX_PG_TEXT_COLUMNS:false}") enabled: Boolean
    ): ApplicationRunner {
        return ApplicationRunner {
            if (!enabled) return@ApplicationRunner
            logger.warn("Barème: BAREME_FIX_PG_TEXT_COLUMNS=true -> tentative de correction BYTEA->TEXT")
            try {
                val sql = """
                    DO $$
                    DECLARE r record;
                    BEGIN
                      FOR r IN
                        SELECT table_name, column_name, data_type
                        FROM information_schema.columns
                        WHERE table_schema='public'
                          AND (
                            (table_name='bareme_lignes_prix' AND column_name IN
                              ('libelle','reference','unite','unite_prestation','famille','categorie','date_prix','code_fournisseur','ref_reception','contact_texte'))
                            OR
                            (table_name='bareme_fournisseurs' AND column_name IN ('nom','contact'))
                          )
                      LOOP
                        IF r.data_type = 'bytea' THEN
                          EXECUTE format(
                            'ALTER TABLE %I ALTER COLUMN %I TYPE text USING convert_from(%I, ''UTF8'')',
                            r.table_name, r.column_name, r.column_name
                          );
                        END IF;
                      END LOOP;
                    END $$;
                """.trimIndent()
                jdbcTemplate.execute(sql)
                logger.warn("Barème: correction BYTEA->TEXT terminée")
            } catch (e: Exception) {
                logger.error("Barème: échec correction BYTEA->TEXT", e)
            }
        }
    }
}

