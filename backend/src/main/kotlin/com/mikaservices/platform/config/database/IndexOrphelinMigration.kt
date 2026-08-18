package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Supprime l'index orphelin idx_doc_type sur documents_engin (PostgreSQL prod).
 * L'index a été renommé en idx_doc_engin_type côté entité (commit 49e664d), mais l'ancien
 * nom reste occupé en prod : les noms d'index sont uniques par schéma en PostgreSQL,
 * ce qui empêche Hibernate de créer idx_doc_type sur la table documents.
 * Idempotent : ne drop que si idx_doc_type est rattaché à documents_engin.
 * Sur MySQL local, la requête pg_indexes échoue silencieusement — aucun effet.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class IndexOrphelinMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(IndexOrphelinMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            val count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_doc_type' AND tablename = 'documents_engin'",
                Int::class.java
            ) ?: 0
            if (count > 0) {
                jdbcTemplate.execute("DROP INDEX IF EXISTS idx_doc_type")
                logger.warn("[IndexOrphelinMigration] Index orphelin idx_doc_type (documents_engin) supprime — Hibernate le recreera sur documents.")
            } else {
                logger.info("[IndexOrphelinMigration] Aucun index orphelin idx_doc_type sur documents_engin — rien a faire.")
            }
        } catch (e: Exception) {
            // MySQL local : pg_indexes n'existe pas — normal, on ignore.
            logger.info("[IndexOrphelinMigration] Ignoree (base non PostgreSQL ?) : ${e.message}")
        }
    }
}
