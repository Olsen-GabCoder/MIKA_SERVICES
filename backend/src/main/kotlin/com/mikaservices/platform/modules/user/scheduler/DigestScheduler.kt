package com.mikaservices.platform.modules.user.scheduler

import com.mikaservices.platform.modules.user.service.DigestService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * Tâche planifiée : envoi des digest (quotidiens et hebdomadaires) à l'heure choisie par chaque utilisateur.
 * Exécution toutes les heures à la minute 0 pour vérifier qui doit recevoir un digest.
 */
@Component
class DigestScheduler(
    private val digestService: DigestService
) {
    private val logger = LoggerFactory.getLogger(DigestScheduler::class.java)

    @Scheduled(cron = "\${app.scheduler.digest-cron:0 0 * * * ?}")
    fun runDigests() {
        try {
            digestService.processDigests()
        } catch (e: Exception) {
            logger.error("Erreur lors de l'envoi des digest: ${e.message}", e)
        }
    }
}
