package com.mikaservices.platform.config.database

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Migration des anciens statuts de projet vers les nouveaux.
 * Utilise @PostConstruct pour s'exécuter AVANT tout CommandLineRunner et avant que JPA ne lise les projets.
 * Idempotent : ne fait rien si aucun ancien statut n'existe.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class StatutProjetMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(StatutProjetMigration::class.java)

    @PostConstruct
    fun migrate() {
        try {
            // PostgreSQL : supprimer la contrainte CHECK sur l'enum statut (bloque les nouvelles valeurs)
            try {
                jdbcTemplate.execute("ALTER TABLE projets DROP CONSTRAINT IF EXISTS projets_statut_check")
                logger.warn("[StatutProjetMigration] Contrainte projets_statut_check supprimee.")
            } catch (e: Exception) {
                logger.warn("[StatutProjetMigration] Pas de contrainte a supprimer : ${e.message}")
            }

            val oldCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projets WHERE statut IN ('EN_ATTENTE','PLANIFIE','EN_COURS','SUSPENDU','TERMINE','ABANDONNE')",
                Int::class.java
            ) ?: 0

            if (oldCount == 0) {
                logger.info("[StatutProjetMigration] Aucun ancien statut detecte — rien a migrer.")
                return
            }

            logger.warn("[StatutProjetMigration] $oldCount projet(s) avec ancien statut — MIGRATION EN COURS...")

            val updates = mapOf(
                "INITIALISATION" to listOf("EN_ATTENTE", "PLANIFIE"),
                "EN_COURS_EXECUTION" to listOf("EN_COURS"),
                "SUSPENSION" to listOf("SUSPENDU"),
                "RECEPTION_DEFINITIVE" to listOf("TERMINE", "ABANDONNE")
            )

            var totalMigrated = 0
            updates.forEach { (newStatut, oldStatuts) ->
                val placeholders = oldStatuts.joinToString(",") { "'$it'" }
                val rows = jdbcTemplate.update(
                    "UPDATE projets SET statut = '$newStatut' WHERE statut IN ($placeholders)"
                )
                if (rows > 0) {
                    logger.warn("[StatutProjetMigration] $rows projet(s) : ${oldStatuts.joinToString("/")} -> $newStatut")
                    totalMigrated += rows
                }
            }

            logger.warn("[StatutProjetMigration] Migration terminee : $totalMigrated projet(s) mis a jour.")

            // Recreer la contrainte CHECK avec les nouvelles valeurs
            try {
                jdbcTemplate.execute("""
                    ALTER TABLE projets ADD CONSTRAINT projets_statut_check
                    CHECK (statut IN ('INITIALISATION','EN_COURS_EXECUTION','SUSPENSION','RECEPTION_PROVISOIRE','RECEPTION_DEFINITIVE','EN_AVANCE'))
                """.trimIndent())
                logger.warn("[StatutProjetMigration] Contrainte projets_statut_check recree avec les nouveaux statuts.")
            } catch (e: Exception) {
                logger.warn("[StatutProjetMigration] Impossible de recreer la contrainte : ${e.message}")
            }
        } catch (e: Exception) {
            logger.error("[StatutProjetMigration] ERREUR migration : ${e.message}", e)
        }
    }
}
