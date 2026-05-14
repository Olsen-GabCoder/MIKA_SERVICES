package com.mikaservices.platform.modules.sallereunion.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.sallereunion.dto.JitsiConfigResponse
import com.mikaservices.platform.modules.sallereunion.dto.SalleReunionResponse
import com.mikaservices.platform.modules.sallereunion.dto.UserSummary
import com.mikaservices.platform.modules.sallereunion.entity.SalleReunion
import com.mikaservices.platform.modules.sallereunion.repository.SalleReunionRepository
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class SalleReunionService(
    private val salleReunionRepository: SalleReunionRepository,
    private val currentUserService: CurrentUserService
) {
    private val logger = LoggerFactory.getLogger(SalleReunionService::class.java)

    /** Retourne l'etat courant de la salle MIKA (accessible a tout utilisateur authentifie). */
    @Transactional(readOnly = true)
    fun getSalle(): SalleReunionResponse {
        return toResponse(getOrThrow())
    }

    /** Retourne la configuration Jitsi pour l'utilisateur courant (roomName, displayName, subject). */
    @Transactional(readOnly = true)
    fun getJitsiConfig(): JitsiConfigResponse {
        val user = requireCurrentUser()
        val salle = getOrThrow()
        return JitsiConfigResponse(
            roomName = salle.roomName,
            displayName = "${user.prenom} ${user.nom}",
            subject = salle.libelle,
            ouverte = salle.ouverte
        )
    }

    /** Ouvre la salle MIKA. Reserve aux ADMIN / SUPER_ADMIN. */
    @Transactional
    fun ouvrirSalle(): SalleReunionResponse {
        val user = requireCurrentUser()
        val salle = getOrThrow()
        if (salle.ouverte) {
            throw ConflictException("La salle est deja ouverte")
        }
        salle.ouverte = true
        salle.dateOuverture = LocalDateTime.now()
        salle.ouvertePar = user
        salle.dateFermeture = null
        salle.fermeePar = null
        val saved = salleReunionRepository.save(salle)
        logger.info("Salle MIKA ouverte par userId=${user.id} email=${user.email}")
        return toResponse(saved)
    }

    /** Ferme la salle MIKA. Reserve aux ADMIN / SUPER_ADMIN. */
    @Transactional
    fun fermerSalle(): SalleReunionResponse {
        val user = requireCurrentUser()
        val salle = getOrThrow()
        if (!salle.ouverte) {
            throw ConflictException("La salle est deja fermee")
        }
        salle.ouverte = false
        salle.dateFermeture = LocalDateTime.now()
        salle.fermeePar = user
        val saved = salleReunionRepository.save(salle)
        logger.info("Salle MIKA fermee par userId=${user.id} email=${user.email}")
        return toResponse(saved)
    }

    /** Acces brut a l'entity SalleReunion (pour JaaSTokenService). */
    @Transactional(readOnly = true)
    fun getSalleEntity(): SalleReunion = getOrThrow()

    // ── Helpers internes ────────────────────────────────────────────────

    private fun getOrThrow(): SalleReunion {
        return salleReunionRepository.findFirstByOrderByIdAsc()
            ?: throw ResourceNotFoundException("Aucune salle configuree. Verifier le seed SalleReunionInitializer.")
    }

    private fun requireCurrentUser(): User {
        return currentUserService.getCurrentUser()
            ?: throw IllegalStateException("Aucun utilisateur authentifie")
    }

    private fun toResponse(salle: SalleReunion): SalleReunionResponse {
        return SalleReunionResponse(
            id = salle.id!!,
            roomName = salle.roomName,
            libelle = salle.libelle,
            ouverte = salle.ouverte,
            dateOuverture = salle.dateOuverture,
            ouvertePar = salle.ouvertePar?.let { toUserSummary(it) },
            dateFermeture = salle.dateFermeture,
            fermeePar = salle.fermeePar?.let { toUserSummary(it) },
            updatedAt = salle.updatedAt
        )
    }

    private fun toUserSummary(user: User): UserSummary {
        return UserSummary(id = user.id!!, nom = user.nom, prenom = user.prenom)
    }
}
