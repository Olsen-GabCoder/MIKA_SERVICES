package com.mikaservices.platform.modules.bareme.config

import com.mikaservices.platform.modules.bareme.service.BaremeSeedService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order

/**
 * Au démarrage, si bareme.seed-enabled=true, exécute le peuplement complet
 * de la base barème (données de test sans aucun champ vide).
 */
@Configuration
class BaremeDataSeeder(
    private val baremeSeedService: BaremeSeedService
) {
    private val logger = LoggerFactory.getLogger(BaremeDataSeeder::class.java)

    @Bean
    @Order(1)
    fun runBaremeSeed(
        @Value("\${bareme.seed-enabled:false}") seedEnabled: Boolean
    ): ApplicationRunner {
        return ApplicationRunner {
            if (!seedEnabled) return@ApplicationRunner
            logger.info("Barème: démarrage du peuplement complet (seed)...")
            try {
                baremeSeedService.seedAll()
                logger.info("Barème: peuplement terminé.")
            } catch (e: Exception) {
                logger.error("Barème: échec du seed", e)
                throw e
            }
        }
    }
}
