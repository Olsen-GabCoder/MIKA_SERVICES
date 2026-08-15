package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.rapport.scheduler.RapportHebdoScheduler
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Endpoint ADMIN pour déclencher manuellement le rapport hebdomadaire PDF.
 *
 * Accès : rôle ADMIN uniquement.
 * Route : POST /api/admin/scheduler/rapport-hebdo
 */
@RestController
@RequestMapping("/api/admin/scheduler")
@PreAuthorize("hasRole('ADMIN')")
class SchedulerAdminController(
    private val rapportHebdoScheduler: RapportHebdoScheduler
) {
    private val logger = LoggerFactory.getLogger(SchedulerAdminController::class.java)

    @PostMapping("/rapport-hebdo")
    fun triggerRapportHebdo(): ResponseEntity<Map<String, String>> {
        logger.info("[SchedulerAdmin] Déclenchement manuel du rapport hebdomadaire PDF")
        return try {
            rapportHebdoScheduler.envoyerRapportHebdo()
            ResponseEntity.ok(mapOf("status" to "ok", "message" to "Rapport hebdomadaire PDF déclenché — vérifiez les logs et votre boîte mail."))
        } catch (e: Exception) {
            logger.error("[SchedulerAdmin] Erreur rapport hebdo: ${e.message}", e)
            ResponseEntity.internalServerError().body(mapOf("status" to "error", "message" to (e.message ?: "Erreur inconnue")))
        }
    }
}
