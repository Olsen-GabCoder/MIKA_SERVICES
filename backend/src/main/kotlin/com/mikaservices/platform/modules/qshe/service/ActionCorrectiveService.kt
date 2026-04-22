package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.ActionCorrectiveCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.ActionCorrectiveUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.ActionCorrectiveResponse
import com.mikaservices.platform.modules.qshe.dto.response.ActionCorrectiveSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.ActionCorrective
import com.mikaservices.platform.modules.qshe.enums.SourceAction
import com.mikaservices.platform.modules.qshe.enums.StatutAction
import com.mikaservices.platform.modules.qshe.mapper.ActionCorrectiveMapper
import com.mikaservices.platform.modules.qshe.repository.ActionCorrectiveRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class ActionCorrectiveService(
    private val actionRepository: ActionCorrectiveRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(ActionCorrectiveService::class.java)

    fun create(request: ActionCorrectiveCreateRequest): ActionCorrectiveResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${request.projetId}") }

        val responsable = request.responsableId?.let {
            userRepository.findById(it).orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $it") }
        }

        val reference = generateReference()

        val action = ActionCorrective(
            projet = projet,
            reference = reference,
            titre = request.titre,
            description = request.description,
            typeAction = request.typeAction,
            priorite = request.priorite,
            sourceType = request.sourceType,
            sourceId = request.sourceId,
            sourceReference = request.sourceReference,
            responsable = responsable,
            dateEcheance = request.dateEcheance,
            descriptionAction = request.descriptionAction
        )

        val saved = actionRepository.save(action)
        logger.info("Action CAPA créée : ${saved.reference} (type=${saved.typeAction}, source=${saved.sourceType}:${saved.sourceId})")
        return ActionCorrectiveMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<ActionCorrectiveResponse> {
        return actionRepository.findByProjetId(projetId, pageable).map { ActionCorrectiveMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findBySource(sourceType: SourceAction, sourceId: Long): List<ActionCorrectiveResponse> {
        return actionRepository.findBySourceTypeAndSourceId(sourceType, sourceId)
            .map { ActionCorrectiveMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findByResponsable(userId: Long, pageable: Pageable): Page<ActionCorrectiveResponse> {
        return actionRepository.findByResponsableId(userId, pageable).map { ActionCorrectiveMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): ActionCorrectiveResponse {
        return ActionCorrectiveMapper.toResponse(getById(id))
    }

    fun update(id: Long, request: ActionCorrectiveUpdateRequest): ActionCorrectiveResponse {
        val action = getById(id)

        request.titre?.let { action.titre = it }
        request.description?.let { action.description = it }
        request.typeAction?.let { action.typeAction = it }
        request.priorite?.let { action.priorite = it }
        request.statut?.let { newStatut ->
            action.statut = newStatut
            if (newStatut == StatutAction.CLOTURE && action.dateCloture == null) {
                action.dateCloture = LocalDate.now()
            }
        }
        request.responsableId?.let { uid ->
            action.responsable = userRepository.findById(uid)
                .orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $uid") }
        }
        request.verificateurId?.let { uid ->
            action.verificateur = userRepository.findById(uid)
                .orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $uid") }
        }
        request.dateEcheance?.let { action.dateEcheance = it }
        request.dateRealisation?.let { action.dateRealisation = it }
        request.dateVerification?.let { action.dateVerification = it }
        request.descriptionAction?.let { action.descriptionAction = it }
        request.resultatVerification?.let { action.resultatVerification = it }
        request.efficace?.let { action.efficace = it }
        request.commentaire?.let { action.commentaire = it }

        val saved = actionRepository.save(action)
        logger.info("Action CAPA mise à jour : ${saved.reference} → statut=${saved.statut}")
        return ActionCorrectiveMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val action = getById(id)
        if (action.statut == StatutAction.CLOTURE) {
            throw BadRequestException("Impossible de supprimer une action clôturée")
        }
        actionRepository.delete(action)
        logger.info("Action CAPA supprimée : ${action.reference}")
    }

    @Transactional(readOnly = true)
    fun findEnRetard(): List<ActionCorrectiveResponse> {
        return actionRepository.findEnRetard(LocalDate.now())
            .map { ActionCorrectiveMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): ActionCorrectiveSummaryResponse {
        val total = actionRepository.countByProjetId(projetId)
        val ouvertes = actionRepository.countByProjetIdAndStatutIn(projetId,
            listOf(StatutAction.PLANIFIEE, StatutAction.EN_COURS))
        val verifiees = actionRepository.countByProjetIdAndStatutIn(projetId,
            listOf(StatutAction.VERIFIEE, StatutAction.CLOTURE))
        val enRetard = actionRepository.countEnRetardByProjet(projetId, LocalDate.now())
        val tauxCloture = if (total > 0) (verifiees.toDouble() / total * 100) else 0.0

        val all = actionRepository.findByProjetId(projetId, Pageable.unpaged()).content
        val parType = all.groupBy { it.typeAction.name }.mapValues { it.value.size.toLong() }
        val parPriorite = all.groupBy { it.priorite.name }.mapValues { it.value.size.toLong() }

        return ActionCorrectiveSummaryResponse(
            totalActions = total,
            actionsEnRetard = enRetard,
            actionsOuvertes = ouvertes,
            actionsVerifiees = verifiees,
            tauxCloture = Math.round(tauxCloture * 100.0) / 100.0,
            parType = parType,
            parPriorite = parPriorite
        )
    }

    private fun getById(id: Long): ActionCorrective {
        return actionRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Action corrective introuvable : $id") }
    }

    private fun generateReference(): String {
        val count = actionRepository.count() + 1
        return "CAPA-%05d".format(count)
    }
}
