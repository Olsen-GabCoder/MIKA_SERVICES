package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.IncidentEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.OperationMaintenanceResponse
import com.mikaservices.platform.modules.materiel.entity.IncidentEngin
import com.mikaservices.platform.modules.materiel.entity.OperationMaintenance
import com.mikaservices.platform.modules.materiel.mapper.IncidentEnginMapper
import com.mikaservices.platform.modules.materiel.mapper.OperationMaintenanceMapper
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.materiel.event.IncidentNotificationEvent
import com.mikaservices.platform.modules.materiel.repository.AffectationEnginChantierRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.IncidentEnginRepository
import com.mikaservices.platform.modules.materiel.repository.OperationMaintenanceRepository
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class IncidentEnginService(
    private val incidentRepository: IncidentEnginRepository,
    private val enginRepository: EnginRepository,
    private val maintenanceRepository: OperationMaintenanceRepository,
    private val affectationRepository: AffectationEnginChantierRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {
    private val logger = LoggerFactory.getLogger(IncidentEnginService::class.java)

    fun create(enginId: Long, request: IncidentEnginCreateRequest): IncidentEnginResponse {
        // Idempotence offline : requête déjà traitée -> renvoyer l'existant (pas de doublon au replay).
        request.clientRequestId?.let { crid ->
            incidentRepository.findByClientRequestId(crid)?.let { return IncidentEnginMapper.toResponse(it) }
        }

        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $enginId") }
        val incident = IncidentEngin(
            engin = engin,
            typeIncident = request.typeIncident,
            gravite = request.gravite,
            dateIncident = request.dateIncident,
            description = request.description,
            lieu = request.lieu,
            signalePar = request.signalePar,
            photoUrls = request.photoUrls?.takeIf { it.isNotEmpty() }?.joinToString(","),
            clientRequestId = request.clientRequestId
        )
        val saved = incidentRepository.save(incident)

        // Si gravité CRITIQUE ou MAJEURE, passer l'engin en EN_PANNE automatiquement
        if (request.gravite in listOf(GraviteIncident.CRITIQUE, GraviteIncident.MAJEURE)) {
            if (engin.statut != StatutEngin.EN_PANNE && engin.statut != StatutEngin.HORS_SERVICE) {
                engin.statut = StatutEngin.EN_PANNE
                enginRepository.save(engin)
                logger.info("Engin ${engin.code} passé EN_PANNE suite à incident ${saved.gravite}")
            }
        }

        logger.info("Incident créé pour engin ${engin.code}: ${saved.typeIncident}")

        // Notifier après commit : responsable du chantier de l'engin + logistique
        val projetEnCours = affectationRepository
            .findByEnginIdAndStatut(enginId, StatutAffectation.EN_COURS)
            .firstOrNull()?.projet
        eventPublisher.publishEvent(
            IncidentNotificationEvent(
                incidentId = saved.id!!,
                enginId = enginId,
                enginCode = engin.code,
                enginNom = engin.nom,
                gravite = saved.gravite,
                typeIncident = saved.typeIncident.toString(),
                description = saved.description,
                projetNom = projetEnCours?.nom,
                projetResponsableId = projetEnCours?.responsableProjetId,
            )
        )
        return IncidentEnginMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<IncidentEnginResponse> {
        return incidentRepository.findByEnginId(enginId, pageable)
            .map { IncidentEnginMapper.toResponse(it) }
    }

    fun update(enginId: Long, incidentId: Long, request: IncidentEnginUpdateRequest): IncidentEnginResponse {
        val incident = getAndVerify(enginId, incidentId)
        request.typeIncident?.let { incident.typeIncident = it }
        request.gravite?.let { incident.gravite = it }
        request.description?.let { incident.description = it }
        request.lieu?.let { incident.lieu = it }
        request.signalePar?.let { incident.signalePar = it }
        request.resolu?.let { incident.resolu = it }
        request.dateResolution?.let { incident.dateResolution = it }
        request.actionsCorrectives?.let { incident.actionsCorrectives = it }

        // Si résolu et engin EN_PANNE sans autres incidents non résolus, remettre DISPONIBLE
        if (incident.resolu) {
            val engin = incident.engin
            if (engin.statut == StatutEngin.EN_PANNE) {
                val autresNonResolus = incidentRepository.countByEnginIdAndResoluFalse(enginId)
                // -1 car l'incident courant n'est pas encore persisté avec resolu=true
                // mais en fait il est déjà modifié en mémoire, donc count sera correct après save
                val saved = incidentRepository.save(incident)
                val remaining = incidentRepository.countByEnginIdAndResoluFalse(enginId)
                if (remaining == 0L) {
                    engin.statut = StatutEngin.DISPONIBLE
                    enginRepository.save(engin)
                    logger.info("Engin ${engin.code} remis DISPONIBLE après résolution de tous les incidents")
                }
                logger.info("Incident ${saved.id} mis à jour pour engin $enginId")
                return IncidentEnginMapper.toResponse(saved)
            }
        }

        val saved = incidentRepository.save(incident)
        logger.info("Incident ${saved.id} mis à jour pour engin $enginId")
        return IncidentEnginMapper.toResponse(saved)
    }

    fun delete(enginId: Long, incidentId: Long) {
        val incident = getAndVerify(enginId, incidentId)
        incidentRepository.delete(incident)
        logger.info("Incident $incidentId supprimé pour engin $enginId")
    }

    /**
     * Crée une maintenance corrective à partir d'un incident.
     * Lie l'incident à l'opération de maintenance créée.
     */
    fun creerMaintenanceCorrective(enginId: Long, incidentId: Long): OperationMaintenanceResponse {
        val incident = getAndVerify(enginId, incidentId)
        if (incident.resolu) {
            throw BadRequestException("Impossible de créer une maintenance corrective pour un incident déjà résolu")
        }

        val operation = OperationMaintenance(
            engin = incident.engin,
            typeOperation = TypeOperationMaintenance.REPARATION,
            statut = StatutMaintenance.PLANIFIEE,
            description = "Maintenance corrective suite à incident: ${incident.typeIncident} " +
                    "(${incident.gravite}) - ${incident.description ?: ""}",
            incidentSourceId = incident.id
        )
        val saved = maintenanceRepository.save(operation)
        logger.info("Maintenance corrective ${saved.id} créée depuis incident $incidentId pour engin ${incident.engin.code}")
        return OperationMaintenanceMapper.toResponse(saved)
    }

    private fun getAndVerify(enginId: Long, incidentId: Long): IncidentEngin {
        val incident = incidentRepository.findById(incidentId)
            .orElseThrow { ResourceNotFoundException("Incident non trouvé avec l'ID: $incidentId") }
        if (incident.engin.id != enginId) {
            throw ResourceNotFoundException("L'incident $incidentId n'appartient pas à l'engin $enginId")
        }
        return incident
    }
}
