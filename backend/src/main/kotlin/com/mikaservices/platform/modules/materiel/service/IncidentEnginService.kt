package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.IncidentEnginResponse
import com.mikaservices.platform.modules.materiel.entity.IncidentEngin
import com.mikaservices.platform.modules.materiel.mapper.IncidentEnginMapper
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.IncidentEnginRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class IncidentEnginService(
    private val incidentRepository: IncidentEnginRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(IncidentEnginService::class.java)

    fun create(enginId: Long, request: IncidentEnginCreateRequest): IncidentEnginResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }
        val incident = IncidentEngin(
            engin = engin,
            typeIncident = request.typeIncident,
            gravite = request.gravite,
            dateIncident = request.dateIncident,
            description = request.description,
            lieu = request.lieu,
            signalePar = request.signalePar
        )
        val saved = incidentRepository.save(incident)
        logger.info("Incident cree pour engin ${engin.code}: ${saved.typeIncident}")
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
        val saved = incidentRepository.save(incident)
        logger.info("Incident ${saved.id} mis a jour pour engin $enginId")
        return IncidentEnginMapper.toResponse(saved)
    }

    fun delete(enginId: Long, incidentId: Long) {
        val incident = getAndVerify(enginId, incidentId)
        incidentRepository.delete(incident)
        logger.info("Incident $incidentId supprime pour engin $enginId")
    }

    private fun getAndVerify(enginId: Long, incidentId: Long): IncidentEngin {
        val incident = incidentRepository.findById(incidentId)
            .orElseThrow { ResourceNotFoundException("Incident non trouve avec l'ID: $incidentId") }
        if (incident.engin.id != enginId) {
            throw ResourceNotFoundException("L'incident $incidentId n'appartient pas a l'engin $enginId")
        }
        return incident
    }
}
