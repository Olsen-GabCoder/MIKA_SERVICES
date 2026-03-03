package com.mikaservices.platform.config

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment

/**
 * Log au démarrage le(s) profil(s) actif(s) pour diagnostic (ex. Railway).
 * S'affiche toujours, même si DataInitializer ne tourne pas (profil non couvert).
 */
@Configuration
class StartupProfileLogger {

    @Bean
    fun startupProfileLogger(environment: Environment): ApplicationRunner {
        return ApplicationRunner {
            val profiles = environment.activeProfiles
            val profileStr = if (profiles.isEmpty()) "aucun" else profiles.joinToString(", ")
            LoggerFactory.getLogger(javaClass).info("MIKA Démarrage - profil(s) actif(s): $profileStr")
        }
    }
}
