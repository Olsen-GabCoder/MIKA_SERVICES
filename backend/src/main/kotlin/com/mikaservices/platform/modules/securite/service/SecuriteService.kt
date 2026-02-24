package com.mikaservices.platform.modules.securite.service

import com.mikaservices.platform.common.enums.StatutActionPrevention
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.securite.dto.request.*
import com.mikaservices.platform.modules.securite.dto.response.*
import com.mikaservices.platform.modules.securite.entity.ActionPrevention
import com.mikaservices.platform.modules.securite.entity.Incident
import com.mikaservices.platform.modules.securite.entity.Risque
import com.mikaservices.platform.modules.securite.mapper.SecuriteMapper
import com.mikaservices.platform.modules.securite.repository.ActionPreventionRepository
import com.mikaservices.platform.modules.securite.repository.IncidentRepository
import com.mikaservices.platform.modules.securite.repository.RisqueRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class SecuriteService(
    private val incidentRepo: IncidentRepository,
    private val risqueRepo: RisqueRepository,
    private val actionRepo: ActionPreventionRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(SecuriteService::class.java)

    // ==================== INCIDENTS ====================

    fun createIncident(request: IncidentCreateRequest): IncidentResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }

        val reference = generateIncidentReference()

        val incident = Incident(
            projet = projet, reference = reference,
            titre = request.titre, description = request.description,
            typeIncident = request.typeIncident, gravite = request.gravite,
            dateIncident = request.dateIncident, heureIncident = request.heureIncident,
            lieu = request.lieu, nbBlesses = request.nbBlesses,
            arretTravail = request.arretTravail, nbJoursArret = request.nbJoursArret,
            mesuresImmediates = request.mesuresImmediates
        )

        request.declareParId?.let { userId ->
            incident.declarePar = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        val saved = incidentRepo.save(incident)
        logger.info("Incident créé: ${saved.reference} - ${saved.titre} (gravité: ${saved.gravite})")
        return SecuriteMapper.toIncidentResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findIncidentsByProjet(projetId: Long, pageable: Pageable): Page<IncidentResponse> {
        return incidentRepo.findByProjetId(projetId, pageable).map { SecuriteMapper.toIncidentResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findIncidentById(id: Long): IncidentResponse {
        val incident = incidentRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Incident non trouvé avec l'ID: $id") }
        return SecuriteMapper.toIncidentResponse(incident)
    }

    fun updateIncident(id: Long, request: IncidentUpdateRequest): IncidentResponse {
        val incident = incidentRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Incident non trouvé avec l'ID: $id") }

        request.titre?.let { incident.titre = it }
        request.description?.let { incident.description = it }
        request.statut?.let { incident.statut = it }
        request.gravite?.let { incident.gravite = it }
        request.causeIdentifiee?.let { incident.causeIdentifiee = it }
        request.mesuresImmediates?.let { incident.mesuresImmediates = it }
        request.analyseCause?.let { incident.analyseCause = it }
        request.nbBlesses?.let { incident.nbBlesses = it }
        request.arretTravail?.let { incident.arretTravail = it }
        request.nbJoursArret?.let { incident.nbJoursArret = it }

        val saved = incidentRepo.save(incident)
        logger.info("Incident mis à jour: ${saved.reference} (statut: ${saved.statut})")
        return SecuriteMapper.toIncidentResponse(saved)
    }

    fun deleteIncident(id: Long) {
        val incident = incidentRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Incident non trouvé avec l'ID: $id") }
        incidentRepo.delete(incident)
        logger.info("Incident supprimé: ${incident.reference}")
    }

    // ==================== RISQUES ====================

    fun createRisque(request: RisqueCreateRequest): RisqueResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: ${request.projetId}") }

        val risque = Risque(
            projet = projet,
            titre = request.titre, description = request.description,
            niveau = request.niveau, probabilite = request.probabilite,
            impact = request.impact, zoneConcernee = request.zoneConcernee,
            mesuresPrevention = request.mesuresPrevention
        )

        val saved = risqueRepo.save(risque)
        logger.info("Risque créé: ${saved.titre} (niveau: ${saved.niveau})")
        return SecuriteMapper.toRisqueResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findRisquesByProjet(projetId: Long, pageable: Pageable): Page<RisqueResponse> {
        return risqueRepo.findByProjetId(projetId, pageable).map { SecuriteMapper.toRisqueResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findRisqueById(id: Long): RisqueResponse {
        val risque = risqueRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Risque non trouvé avec l'ID: $id") }
        return SecuriteMapper.toRisqueResponse(risque)
    }

    fun updateRisque(id: Long, request: RisqueUpdateRequest): RisqueResponse {
        val risque = risqueRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Risque non trouvé avec l'ID: $id") }

        request.titre?.let { risque.titre = it }
        request.description?.let { risque.description = it }
        request.niveau?.let { risque.niveau = it }
        request.probabilite?.let { risque.probabilite = it }
        request.impact?.let { risque.impact = it }
        request.zoneConcernee?.let { risque.zoneConcernee = it }
        request.mesuresPrevention?.let { risque.mesuresPrevention = it }
        request.actif?.let { risque.actif = it }

        val saved = risqueRepo.save(risque)
        logger.info("Risque mis à jour: ${saved.titre} (niveau: ${saved.niveau})")
        return SecuriteMapper.toRisqueResponse(saved)
    }

    fun deleteRisque(id: Long) {
        val risque = risqueRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Risque non trouvé avec l'ID: $id") }
        risqueRepo.delete(risque)
        logger.info("Risque supprimé: ${risque.titre}")
    }

    // ==================== ACTIONS PRÉVENTION ====================

    fun createAction(request: ActionPreventionCreateRequest): ActionPreventionResponse {
        val action = ActionPrevention(
            titre = request.titre, description = request.description,
            dateEcheance = request.dateEcheance
        )

        request.incidentId?.let { incidentId ->
            action.incident = incidentRepo.findById(incidentId)
                .orElseThrow { ResourceNotFoundException("Incident non trouvé avec l'ID: $incidentId") }
        }

        request.responsableId?.let { userId ->
            action.responsable = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        val saved = actionRepo.save(action)
        logger.info("Action de prévention créée: ${saved.titre}")
        return SecuriteMapper.toActionPreventionResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findActionsByIncident(incidentId: Long): List<ActionPreventionResponse> {
        return actionRepo.findByIncidentId(incidentId).map { SecuriteMapper.toActionPreventionResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findActionsEnRetard(): List<ActionPreventionResponse> {
        return actionRepo.findEnRetard(LocalDate.now()).map { SecuriteMapper.toActionPreventionResponse(it) }
    }

    fun updateAction(id: Long, request: ActionPreventionUpdateRequest): ActionPreventionResponse {
        val action = actionRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Action de prévention non trouvée avec l'ID: $id") }

        request.titre?.let { action.titre = it }
        request.description?.let { action.description = it }
        request.statut?.let { action.statut = it }
        request.dateEcheance?.let { action.dateEcheance = it }
        request.dateRealisation?.let { action.dateRealisation = it }
        request.commentaireVerification?.let { action.commentaireVerification = it }

        request.responsableId?.let { userId ->
            action.responsable = userRepository.findById(userId)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $userId") }
        }

        if (action.statut == StatutActionPrevention.REALISEE && action.dateRealisation == null) {
            action.dateRealisation = LocalDate.now()
        }

        val saved = actionRepo.save(action)
        logger.info("Action de prévention mise à jour: ${saved.titre} (statut: ${saved.statut})")
        return SecuriteMapper.toActionPreventionResponse(saved)
    }

    fun deleteAction(id: Long) {
        val action = actionRepo.findById(id)
            .orElseThrow { ResourceNotFoundException("Action de prévention non trouvée avec l'ID: $id") }
        actionRepo.delete(action)
        logger.info("Action de prévention supprimée: ${action.titre}")
    }

    // ==================== TABLEAU DE BORD ====================

    @Transactional(readOnly = true)
    fun getSecuriteSummary(projetId: Long): SecuriteSummaryResponse {
        val totalIncidents = incidentRepo.countByProjetId(projetId)
        val incidentsGraves = incidentRepo.countGravesParProjet(projetId)
        val totalJoursArret = incidentRepo.sumJoursArretParProjet(projetId) ?: 0L
        val incidentsParGraviteRaw = incidentRepo.countByGraviteForProjet(projetId)
        val incidentsParGravite = incidentsParGraviteRaw.associate { row -> (row[0] as Enum<*>).name to (row[1] as Long) }
        val risquesActifs = risqueRepo.countActifsParProjet(projetId)
        val risquesCritiques = risqueRepo.countCritiquesParProjet(projetId)
        val actionsEnRetard = actionRepo.findEnRetard(LocalDate.now()).size

        return SecuriteSummaryResponse(
            totalIncidents = totalIncidents,
            incidentsGraves = incidentsGraves,
            totalJoursArret = totalJoursArret,
            incidentsParGravite = incidentsParGravite,
            risquesActifs = risquesActifs,
            risquesCritiques = risquesCritiques,
            actionsEnRetard = actionsEnRetard
        )
    }

    private fun generateIncidentReference(): String {
        val count = incidentRepo.count() + 1
        return "INC-${String.format("%05d", count)}"
    }
}
