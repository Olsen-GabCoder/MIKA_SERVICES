package com.mikaservices.platform.config.database

import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate

/**
 * Migration one-shot des anciens statuts de projet vers les nouveaux.
 * S'exécute à chaque démarrage mais ne fait rien si aucun ancien statut n'existe.
 * Safe pour tous les profils (dev, staging, prod).
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
class StatutProjetMigration(
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(StatutProjetMigration::class.java)

    @Bean
    fun migrateStatutProjet(): CommandLineRunner {
        return CommandLineRunner {
            try {
                // Vérifier si des anciens statuts existent encore
                val oldCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM projets WHERE statut IN ('EN_ATTENTE','PLANIFIE','EN_COURS','SUSPENDU','TERMINE','ABANDONNE')",
                    Int::class.java
                ) ?: 0

                if (oldCount == 0) return@CommandLineRunner

                logger.info("[StatutProjetMigration] $oldCount projet(s) avec ancien statut — migration en cours...")

                // PostgreSQL utilise VARCHAR pour les enums JPA (pas MySQL ENUM)
                // Les UPDATE fonctionnent directement
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
                        logger.info("[StatutProjetMigration] $rows projet(s) : ${oldStatuts.joinToString("/")} → $newStatut")
                        totalMigrated += rows
                    }
                }

                logger.info("[StatutProjetMigration] Migration terminée : $totalMigrated projet(s) mis à jour.")
            } catch (e: Exception) {
                logger.warn("[StatutProjetMigration] Migration ignorée (table peut-être pas encore créée) : ${e.message}")
            }
        }
    }
}
