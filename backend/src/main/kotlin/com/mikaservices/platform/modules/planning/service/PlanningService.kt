package com.mikaservices.platform.modules.planning.service

import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.common.exception.ForbiddenException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.planning.dto.request.TacheCreateRequest
import com.mikaservices.platform.modules.planning.dto.request.TacheUpdateRequest
import com.mikaservices.platform.modules.planning.dto.response.TacheResponse
import com.mikaservices.platform.modules.planning.entity.Tache
import com.mikaservices.platform.modules.planning.mapper.TacheMapper
import com.mikaservices.platform.modules.planning.repository.TacheRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class PlanningService(
    private val tacheRepository: TacheRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository,
    private val currentUserService: CurrentUserService
) {
    private val logger = LoggerFactory.getLogger(PlanningService::class.java)

    fun createTache(request: TacheCreateRequest): TacheResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }
        if (!currentUserService.canEditProjet(projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut créer des tâches pour ce projet.")
        }

        val tache = Tache(
            projet = projet, titre = request.titre,
            description = request.description, priorite = request.priorite,
            dateDebut = request.dateDebut, dateFin = request.dateFin, dateEcheance = request.dateEcheance
        )

        request.assigneAId?.let { userId ->
            tache.assigneA = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        request.tacheParentId?.let { parentId ->
            tache.tacheParent = tacheRepository.findById(parentId)
                .orElseThrow { ResourceNotFoundException("Tâche parente non trouvée avec l'ID: $parentId") }
        }

        val saved = tacheRepository.save(tache)
        logger.info("Tâche créée: ${saved.titre} pour le projet ${projet.nom}")
        return TacheMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<TacheResponse> {
        return tacheRepository.findByProjetId(projetId, pageable).map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): TacheResponse {
        val tache = tacheRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tâche non trouvée avec l'ID: $id") }
        return TacheMapper.toResponse(tache)
    }

    @Transactional(readOnly = true)
    fun findMesTaches(userId: Long): List<TacheResponse> {
        return tacheRepository.findTachesEnCoursParUtilisateur(userId).map { TacheMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findTachesEnRetard(): List<TacheResponse> {
        return tacheRepository.findTachesEnRetard(LocalDate.now()).map { TacheMapper.toResponse(it) }
    }

    fun updateTache(id: Long, request: TacheUpdateRequest): TacheResponse {
        val tache = tacheRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tâche non trouvée avec l'ID: $id") }
        if (!currentUserService.canEditProjet(tache.projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut modifier les tâches de ce projet.")
        }

        request.titre?.let { tache.titre = it }
        request.description?.let { tache.description = it }
        request.statut?.let { tache.statut = it }
        request.priorite?.let { tache.priorite = it }
        request.dateDebut?.let { tache.dateDebut = it }
        request.dateFin?.let { tache.dateFin = it }
        request.dateEcheance?.let { tache.dateEcheance = it }
        request.pourcentageAvancement?.let { tache.pourcentageAvancement = it }

        request.assigneAId?.let { userId ->
            tache.assigneA = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        // Si terminée, mettre avancement à 100
        if (tache.statut == StatutTache.TERMINEE) {
            tache.pourcentageAvancement = 100
            if (tache.dateFin == null) tache.dateFin = LocalDate.now()
        }

        val saved = tacheRepository.save(tache)
        logger.info("Tâche mise à jour: ${saved.titre} (statut: ${saved.statut})")
        return TacheMapper.toResponse(saved)
    }

    fun deleteTache(id: Long) {
        val tache = tacheRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tâche non trouvée avec l'ID: $id") }
        if (!currentUserService.canEditProjet(tache.projet.responsableProjet?.id)) {
            throw ForbiddenException("Seul le chef de projet peut supprimer les tâches de ce projet.")
        }
        tacheRepository.delete(tache)
        logger.info("Tâche supprimée: ${tache.titre}")
    }
}
