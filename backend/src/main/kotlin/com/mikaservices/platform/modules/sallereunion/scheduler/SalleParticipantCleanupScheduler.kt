package com.mikaservices.platform.modules.sallereunion.scheduler

import com.mikaservices.platform.modules.sallereunion.service.SalleParticipantService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class SalleParticipantCleanupScheduler(
    private val salleParticipantService: SalleParticipantService
) {
    private val logger = LoggerFactory.getLogger(SalleParticipantCleanupScheduler::class.java)

    /** Toutes les 5 minutes : force le depart des sessions sans heartbeat recent. */
    @Scheduled(fixedRate = 300_000)
    fun cleanupStaleParticipants() {
        try {
            salleParticipantService.cleanupStaleParticipants()
        } catch (e: Exception) {
            logger.error("[SalleParticipantCleanup] Erreur lors du cleanup: ${e.message}", e)
        }
    }
}
