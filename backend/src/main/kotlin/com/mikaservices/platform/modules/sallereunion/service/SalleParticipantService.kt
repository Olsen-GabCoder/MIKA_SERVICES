package com.mikaservices.platform.modules.sallereunion.service

import com.mikaservices.platform.modules.sallereunion.dto.SalleParticipantResponse
import com.mikaservices.platform.modules.sallereunion.dto.UserSummary
import com.mikaservices.platform.modules.sallereunion.entity.SalleParticipant
import com.mikaservices.platform.modules.sallereunion.repository.SalleParticipantRepository
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class SalleParticipantService(
    private val salleParticipantRepository: SalleParticipantRepository,
    private val salleReunionService: SalleReunionService,
    private val currentUserService: CurrentUserService,
) {
    private val logger = LoggerFactory.getLogger(SalleParticipantService::class.java)

    @Transactional
    fun join(): SalleParticipantResponse {
        val user = requireUser()
        val salle = salleReunionService.getSalleEntity()
        if (!salle.ouverte) {
            throw IllegalStateException("Impossible de rejoindre une salle fermee")
        }
        // Si deja en session active, retourner l'existant
        val existing = salleParticipantRepository.findBySalleIdAndUserIdAndLeftAtIsNull(salle.id!!, user.id!!)
        if (existing != null) {
            existing.lastHeartbeatAt = LocalDateTime.now()
            salleParticipantRepository.save(existing)
            return toResponse(existing)
        }
        val participant = SalleParticipant(salle = salle, user = user)
        val saved = salleParticipantRepository.save(participant)
        logger.info("Participant joined salle=${salle.id} userId=${user.id}")
        return toResponse(saved)
    }

    @Transactional
    fun leave(): SalleParticipantResponse? {
        val user = requireUser()
        val salle = salleReunionService.getSalleEntity()
        val existing = salleParticipantRepository.findBySalleIdAndUserIdAndLeftAtIsNull(salle.id!!, user.id!!)
            ?: return null
        existing.leftAt = LocalDateTime.now()
        val saved = salleParticipantRepository.save(existing)
        logger.info("Participant left salle=${salle.id} userId=${user.id}")
        return toResponse(saved)
    }

    @Transactional
    fun heartbeat() {
        val user = requireUser()
        val salle = salleReunionService.getSalleEntity()
        val existing = salleParticipantRepository.findBySalleIdAndUserIdAndLeftAtIsNull(salle.id!!, user.id!!)
            ?: return
        existing.lastHeartbeatAt = LocalDateTime.now()
        salleParticipantRepository.save(existing)
    }

    @Transactional(readOnly = true)
    fun getOnlineParticipants(): List<SalleParticipantResponse> {
        val salle = salleReunionService.getSalleEntity()
        return salleParticipantRepository.findBySalleIdAndLeftAtIsNull(salle.id!!)
            .map { toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun countDistinctParticipantsSince(since: LocalDateTime): Long {
        val salle = salleReunionService.getSalleEntity()
        return salleParticipantRepository.countDistinctUsersSince(salle.id!!, since)
    }

    @Transactional
    fun cleanupStaleParticipants(): Int {
        val now = LocalDateTime.now()
        val cutoff = now.minusMinutes(5)
        val count = salleParticipantRepository.forceLeaveStaleParticipants(cutoff, now)
        if (count > 0) {
            logger.info("Cleanup: forced leave for $count stale participant(s)")
        }
        return count
    }

    private fun requireUser(): User {
        return currentUserService.getCurrentUser()
            ?: throw IllegalStateException("Aucun utilisateur authentifie")
    }

    private fun toResponse(p: SalleParticipant): SalleParticipantResponse {
        return SalleParticipantResponse(
            id = p.id!!,
            user = UserSummary(id = p.user.id!!, nom = p.user.nom, prenom = p.user.prenom),
            joinedAt = p.joinedAt,
            leftAt = p.leftAt,
        )
    }
}
