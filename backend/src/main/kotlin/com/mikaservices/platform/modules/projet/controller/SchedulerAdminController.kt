package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.projet.scheduler.PlatformStatusScheduler
import com.mikaservices.platform.modules.projet.scheduler.ProjetRappelScheduler
import com.mikaservices.platform.modules.rapport.scheduler.RapportHebdoScheduler
import com.mikaservices.platform.modules.reunionhebdo.scheduler.ReunionHebdoPVScheduler
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Endpoints ADMIN pour déclencher manuellement les schedulers d'emails.
 * Utile en production/test pour vérifier que les emails partent bien
 * sans attendre le cron.
 *
 * Accès : rôle ADMIN uniquement.
 * Routes :
 *   POST /api/admin/scheduler/rapport-plateforme
 *   POST /api/admin/scheduler/rappel-projets-mercredi
 *   POST /api/admin/scheduler/rappel-projets-jeudi
 *   POST /api/admin/scheduler/pv-hebdo
 */
@RestController
@RequestMapping("/api/admin/scheduler")
@PreAuthorize("hasRole('ADMIN')")
class SchedulerAdminController(
    private val platformStatusScheduler: PlatformStatusScheduler,
    private val projetRappelScheduler: ProjetRappelScheduler,
    private val reunionHebdoPVScheduler: ReunionHebdoPVScheduler,
    private val rapportHebdoScheduler: RapportHebdoScheduler,
) {
    private val logger = LoggerFactory.getLogger(SchedulerAdminController::class.java)

    @PostMapping("/rapport-plateforme")
    fun triggerRapportPlateforme(): ResponseEntity<Map<String, String>> {
        logger.info("[SchedulerAdmin] Déclenchement manuel du rapport plateforme")
        return try {
            platformStatusScheduler.envoyerRapportQuotidien()
            ResponseEntity.ok(mapOf("status" to "ok", "message" to "Rapport plateforme déclenché — vérifiez les logs et votre boîte mail."))
        } catch (e: Exception) {
            logger.error("[SchedulerAdmin] Erreur rapport plateforme: ${e.message}", e)
            ResponseEntity.internalServerError().body(mapOf("status" to "error", "message" to (e.message ?: "Erreur inconnue")))
        }
    }

    @PostMapping("/rappel-projets-mercredi")
    fun triggerRappelMercredi(): ResponseEntity<Map<String, String>> {
        logger.info("[SchedulerAdmin] Déclenchement manuel du rappel mercredi")
        return try {
            projetRappelScheduler.rappelMercredi()
            ResponseEntity.ok(mapOf("status" to "ok", "message" to "Rappel mercredi déclenché — vérifiez les logs et votre boîte mail."))
        } catch (e: Exception) {
            logger.error("[SchedulerAdmin] Erreur rappel mercredi: ${e.message}", e)
            ResponseEntity.internalServerError().body(mapOf("status" to "error", "message" to (e.message ?: "Erreur inconnue")))
        }
    }

    @PostMapping("/rappel-projets-jeudi")
    fun triggerRappelJeudi(): ResponseEntity<Map<String, String>> {
        logger.info("[SchedulerAdmin] Déclenchement manuel du rappel jeudi")
        return try {
            projetRappelScheduler.rappelJeudi()
            ResponseEntity.ok(mapOf("status" to "ok", "message" to "Rappel jeudi déclenché — vérifiez les logs et votre boîte mail."))
        } catch (e: Exception) {
            logger.error("[SchedulerAdmin] Erreur rappel jeudi: ${e.message}", e)
            ResponseEntity.internalServerError().body(mapOf("status" to "error", "message" to (e.message ?: "Erreur inconnue")))
        }
    }

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

    @PostMapping("/pv-hebdo")
    fun triggerPVHebdo(): ResponseEntity<Map<String, String>> {
        logger.info("[SchedulerAdmin] Déclenchement manuel du PV hebdomadaire")
        return try {
            reunionHebdoPVScheduler.envoyerPVHebdo()
            ResponseEntity.ok(mapOf("status" to "ok", "message" to "PV hebdomadaire déclenché — vérifiez les logs et votre boîte mail."))
        } catch (e: Exception) {
            logger.error("[SchedulerAdmin] Erreur PV hebdo: ${e.message}", e)
            ResponseEntity.internalServerError().body(mapOf("status" to "error", "message" to (e.message ?: "Erreur inconnue")))
        }
    }
}
