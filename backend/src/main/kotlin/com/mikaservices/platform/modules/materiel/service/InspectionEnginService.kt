package com.mikaservices.platform.modules.materiel.service

import tools.jackson.core.type.TypeReference
import tools.jackson.databind.ObjectMapper
import com.mikaservices.platform.common.enums.EtatGeneralInspection
import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.ChecklistItemDto
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.InspectionEnginResponse
import com.mikaservices.platform.modules.materiel.entity.InspectionEngin
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import com.mikaservices.platform.modules.materiel.repository.InspectionEnginRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class InspectionEnginService(
    private val inspectionRepository: InspectionEnginRepository,
    private val enginRepository: EnginRepository,
    private val incidentEnginService: IncidentEnginService,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(InspectionEnginService::class.java)

    fun create(enginId: Long, request: InspectionEnginCreateRequest): InspectionEnginResponse {
        // Idempotence offline : requête déjà traitée -> renvoyer l'existant (pas de doublon au replay).
        request.clientRequestId?.let { crid ->
            inspectionRepository.findByClientRequestId(crid)?.let { return toResponse(it) }
        }

        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouvé avec l'ID: $enginId") }

        if (inspectionRepository.existsByEnginIdAndDateInspection(enginId, request.dateInspection)) {
            throw BadRequestException("Une inspection existe déjà pour cet engin le ${request.dateInspection}")
        }

        val anomalies = request.checklist.any { !it.ok }
        // Sécurité : une inspection signalant une anomalie doit être documentée par au moins une photo.
        if (anomalies && request.photoUrls.isNullOrEmpty()) {
            throw BadRequestException("Une photo est obligatoire lorsqu'une anomalie est détectée.")
        }
        val inspection = InspectionEngin(
            engin = engin,
            dateInspection = request.dateInspection,
            inspectePar = request.inspectePar,
            compteurHeures = request.compteurHeures,
            checklistResultats = if (request.checklist.isEmpty()) null else objectMapper.writeValueAsString(request.checklist),
            etatGeneral = request.etatGeneral,
            anomaliesDetectees = anomalies,
            commentaire = request.commentaire,
            signature = request.signature,
            photoUrls = request.photoUrls?.takeIf { it.isNotEmpty() }?.let { objectMapper.writeValueAsString(it) },
            clientRequestId = request.clientRequestId
        )

        // Anomalie détectée -> incident créé via IncidentEnginService pour hériter de
        // l'immobilisation auto (EN_PANNE si MAJEURE/CRITIQUE) et de la notification
        // logistique + responsable de chantier (AFTER_COMMIT).
        if (anomalies) {
            val itemsNok = request.checklist.filter { !it.ok }
            val gravite = if (request.etatGeneral == EtatGeneralInspection.MAUVAIS) GraviteIncident.MAJEURE else GraviteIncident.MINEURE
            val incident = incidentEnginService.create(enginId, IncidentEnginCreateRequest(
                typeIncident = TypeIncidentEngin.DEFAUT_TECHNIQUE,
                gravite = gravite,
                dateIncident = request.dateInspection,
                description = "Anomalie(s) détectée(s) lors de l'inspection quotidienne : " +
                        itemsNok.joinToString("; ") { it.label + (it.commentaire?.let { c -> " ($c)" } ?: "") },
                signalePar = request.inspectePar,
                photoUrls = request.photoUrls,
            ))
            inspection.incidentCreeId = incident.id
            logger.info("Incident ${incident.id} créé automatiquement depuis inspection (engin ${engin.code})")
        }

        // Mise à jour du compteur si le relevé d'inspection est plus récent
        request.compteurHeures?.let { h ->
            if (h > engin.heuresCompteur) {
                engin.heuresCompteur = h
                enginRepository.save(engin)
            }
        }

        val saved = inspectionRepository.save(inspection)
        logger.info("Inspection ${saved.id} créée pour engin ${engin.code} (${saved.etatGeneral}, anomalies=$anomalies)")
        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<InspectionEnginResponse> {
        return inspectionRepository.findByEnginIdOrderByDateInspectionDesc(enginId, pageable).map { toResponse(it) }
    }

    private fun toResponse(i: InspectionEngin): InspectionEnginResponse {
        val checklist: List<ChecklistItemDto> = i.checklistResultats?.let {
            try {
                objectMapper.readValue(it, object : TypeReference<List<ChecklistItemDto>>() {})
            } catch (e: Exception) {
                logger.warn("Checklist illisible pour inspection ${i.id}: ${e.message}")
                emptyList()
            }
        } ?: emptyList()
        return InspectionEnginResponse(
            id = i.id!!,
            enginId = i.engin.id!!,
            dateInspection = i.dateInspection,
            inspectePar = i.inspectePar,
            compteurHeures = i.compteurHeures,
            checklist = checklist,
            etatGeneral = i.etatGeneral,
            anomaliesDetectees = i.anomaliesDetectees,
            commentaire = i.commentaire,
            signature = i.signature,
            incidentCreeId = i.incidentCreeId,
            photoUrls = i.photoUrls?.let {
                try { objectMapper.readValue(it, object : TypeReference<List<String>>() {}) }
                catch (_: Exception) { null }
            },
            createdAt = i.createdAt
        )
    }
}
