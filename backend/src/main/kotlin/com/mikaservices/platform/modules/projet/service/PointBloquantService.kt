package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.request.PointBloquantCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.PointBloquantUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.PointBloquantResponse
import com.mikaservices.platform.modules.projet.entity.PointBloquant
import com.mikaservices.platform.modules.projet.mapper.PointBloquantMapper
import com.mikaservices.platform.modules.projet.repository.PointBloquantRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class PointBloquantService(
    private val pointBloquantRepository: PointBloquantRepository,
    private val projetService: ProjetService,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(PointBloquantService::class.java)

    fun create(request: PointBloquantCreateRequest): PointBloquantResponse {
        val projet = projetService.getProjetById(request.projetId)

        val pointBloquant = PointBloquant(
            projet = projet,
            titre = request.titre,
            description = request.description,
            priorite = request.priorite,
            dateDetection = request.dateDetection
        )

        request.detecteParId?.let { userId ->
            pointBloquant.detectePar = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        request.assigneAId?.let { userId ->
            pointBloquant.assigneA = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        val saved = pointBloquantRepository.save(pointBloquant)
        logger.info("Point bloquant créé: ${saved.titre} pour le projet ${projet.nom}")
        return PointBloquantMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<PointBloquantResponse> {
        return pointBloquantRepository.findByProjetId(projetId, pageable)
            .map { PointBloquantMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): PointBloquantResponse {
        return PointBloquantMapper.toResponse(getPointBloquantById(id))
    }

    @Transactional(readOnly = true)
    fun findByStatut(statut: StatutPointBloquant): List<PointBloquantResponse> {
        return pointBloquantRepository.findByStatut(statut).map { PointBloquantMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByAssigne(userId: Long): List<PointBloquantResponse> {
        return pointBloquantRepository.findByAssigneAId(userId).map { PointBloquantMapper.toResponse(it) }
    }

    fun update(id: Long, request: PointBloquantUpdateRequest): PointBloquantResponse {
        val pb = getPointBloquantById(id)

        request.titre?.let { pb.titre = it }
        request.description?.let { pb.description = it }
        request.priorite?.let { pb.priorite = it }
        request.statut?.let { pb.statut = it }
        request.dateResolution?.let { pb.dateResolution = it }
        request.actionCorrective?.let { pb.actionCorrective = it }

        request.assigneAId?.let { userId ->
            pb.assigneA = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        // Si résolu, mettre la date de résolution si non définie
        if (pb.statut == StatutPointBloquant.RESOLU && pb.dateResolution == null) {
            pb.dateResolution = java.time.LocalDate.now()
        }

        val saved = pointBloquantRepository.save(pb)
        logger.info("Point bloquant mis à jour: ${saved.titre} (statut: ${saved.statut})")
        return PointBloquantMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val pb = getPointBloquantById(id)
        pointBloquantRepository.delete(pb)
        logger.info("Point bloquant supprimé: ${pb.titre}")
    }

    private fun getPointBloquantById(id: Long): PointBloquant {
        return pointBloquantRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Point bloquant non trouvé avec l'ID: $id") }
    }
}
