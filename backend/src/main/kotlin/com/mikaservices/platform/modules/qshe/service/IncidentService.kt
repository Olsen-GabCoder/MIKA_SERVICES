package com.mikaservices.platform.modules.qshe.service

import com.mikaservices.platform.modules.qshe.enums.GraviteIncident
import com.mikaservices.platform.modules.qshe.enums.StatutIncident
import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.projet.repository.SousProjetRepository
import com.mikaservices.platform.modules.qshe.dto.request.IncidentCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.IncidentUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.IncidentResponse
import com.mikaservices.platform.modules.qshe.dto.response.IncidentSummaryResponse
import com.mikaservices.platform.modules.qshe.entity.Incident
import com.mikaservices.platform.modules.qshe.entity.TemoinIncident
import com.mikaservices.platform.modules.qshe.entity.VictimeIncident
import com.mikaservices.platform.modules.qshe.mapper.IncidentMapper
import com.mikaservices.platform.modules.qshe.repository.IncidentRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class IncidentService(
    private val incidentRepository: IncidentRepository,
    private val projetRepository: ProjetRepository,
    private val sousProjetRepository: SousProjetRepository,
    private val userRepository: UserRepository,
    private val qsheNotificationService: QsheNotificationService
) {
    private val logger = LoggerFactory.getLogger(IncidentService::class.java)

    // ==================== CRUD ====================

    fun createIncident(request: IncidentCreateRequest): IncidentResponse {
        val projet = projetRepository.findById(request.projetId)
            .orElseThrow { ResourceNotFoundException("Projet introuvable : ${request.projetId}") }

        val sousProjet = request.sousProjetId?.let {
            sousProjetRepository.findById(it)
                .orElseThrow { ResourceNotFoundException("Sous-projet introuvable : $it") }
        }

        val declarePar = request.declareParId?.let {
            userRepository.findById(it).orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $it") }
        }

        val reference = generateReference()

        val incident = Incident(
            projet = projet,
            reference = reference,
            titre = request.titre,
            description = request.description,
            typeIncident = request.typeIncident,
            gravite = request.gravite,
            dateIncident = request.dateIncident,
            heureIncident = request.heureIncident,
            lieu = request.lieu,
            zoneChantier = request.zoneChantier,
            latitude = request.latitude,
            longitude = request.longitude,
            sousProjet = sousProjet,
            declarePar = declarePar,
            descriptionCirconstances = request.descriptionCirconstances,
            activiteEnCours = request.activiteEnCours,
            equipementImplique = request.equipementImplique,
            epiPortes = request.epiPortes,
            causeImmediate = request.causeImmediate,
            causeRacine = request.causeRacine,
            mesuresConservatoires = request.mesuresConservatoires
        )

        // ALERTE REGLEMENTAIRE — Calcul echeances CNSS et Inspection du Travail
        // Code du Travail gabonais Art. 206 : declaration sous 48h calendaires
        calculerEcheancesReglementaires(incident)

        // Victimes
        request.victimes.forEach { vReq ->
            val victimeUser = vReq.userId?.let { userRepository.findById(it).orElse(null) }
            incident.victimes.add(VictimeIncident(
                incident = incident,
                user = victimeUser,
                nom = vReq.nom,
                prenom = vReq.prenom,
                poste = vReq.poste,
                entreprise = vReq.entreprise,
                anciennete = vReq.anciennete,
                typeContrat = vReq.typeContrat,
                natureLesion = vReq.natureLesion,
                localisationCorporelle = vReq.localisationCorporelle,
                descriptionBlessure = vReq.descriptionBlessure,
                arretTravail = vReq.arretTravail,
                nbJoursArret = vReq.nbJoursArret,
                hospitalisation = vReq.hospitalisation
            ))
        }

        // Temoins
        request.temoins.forEach { tReq ->
            incident.temoins.add(TemoinIncident(
                incident = incident,
                nom = tReq.nom,
                prenom = tReq.prenom,
                telephone = tReq.telephone,
                email = tReq.email,
                entreprise = tReq.entreprise,
                temoignage = tReq.temoignage
            ))
        }

        val saved = incidentRepository.save(incident)
        logger.info("Incident créé : ${saved.reference} (type=${saved.typeIncident}, gravité=${saved.gravite})")
        try { qsheNotificationService.notifierIncidentCree(saved) } catch (e: Exception) { logger.warn("Échec notification incident: ${e.message}") }
        return IncidentMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<IncidentResponse> {
        return incidentRepository.findByProjetId(projetId, pageable).map { IncidentMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): IncidentResponse {
        val incident = getIncidentById(id)
        return IncidentMapper.toResponse(incident)
    }

    fun updateIncident(id: Long, request: IncidentUpdateRequest): IncidentResponse {
        val incident = getIncidentById(id)

        request.titre?.let { incident.titre = it }
        request.description?.let { incident.description = it }
        request.typeIncident?.let { incident.typeIncident = it }
        request.gravite?.let { incident.gravite = it }
        request.statut?.let { incident.statut = it }
        request.dateIncident?.let {
            incident.dateIncident = it
            calculerEcheancesReglementaires(incident)
        }
        request.heureIncident?.let { incident.heureIncident = it }
        request.lieu?.let { incident.lieu = it }
        request.zoneChantier?.let { incident.zoneChantier = it }
        request.latitude?.let { incident.latitude = it }
        request.longitude?.let { incident.longitude = it }
        request.sousProjetId?.let { spId ->
            incident.sousProjet = sousProjetRepository.findById(spId)
                .orElseThrow { ResourceNotFoundException("Sous-projet introuvable : $spId") }
        }
        request.descriptionCirconstances?.let { incident.descriptionCirconstances = it }
        request.activiteEnCours?.let { incident.activiteEnCours = it }
        request.equipementImplique?.let { incident.equipementImplique = it }
        request.epiPortes?.let { incident.epiPortes = it }
        request.causeImmediate?.let { incident.causeImmediate = it }
        request.causeRacine?.let { incident.causeRacine = it }
        request.mesuresConservatoires?.let { incident.mesuresConservatoires = it }

        // Mise a jour declarations reglementaires
        request.declarationCnssEffectuee?.let { incident.declarationCnssEffectuee = it }
        request.dateDeclarationCnss?.let { incident.dateDeclarationCnss = it }
        request.declarationInspectionEffectuee?.let { incident.declarationInspectionEffectuee = it }
        request.dateDeclarationInspection?.let { incident.dateDeclarationInspection = it }

        val saved = incidentRepository.save(incident)
        logger.info("Incident mis à jour : ${saved.reference}")
        return IncidentMapper.toResponse(saved)
    }

    fun deleteIncident(id: Long) {
        val incident = getIncidentById(id)
        if (incident.statut == StatutIncident.CLOTURE) {
            throw BadRequestException("Impossible de supprimer un incident clôturé")
        }
        incidentRepository.delete(incident)
        logger.info("Incident supprimé : ${incident.reference}")
    }

    fun changeStatut(id: Long, nouveauStatut: StatutIncident): IncidentResponse {
        val incident = getIncidentById(id)
        incident.statut = nouveauStatut
        val saved = incidentRepository.save(incident)
        logger.info("Statut incident ${saved.reference} → $nouveauStatut")
        return IncidentMapper.toResponse(saved)
    }

    // ==================== Summary ====================

    @Transactional(readOnly = true)
    fun getSummary(projetId: Long): IncidentSummaryResponse {
        val gravesEtMortels = listOf(GraviteIncident.GRAVE, GraviteIncident.MORTELLE)
        val total = incidentRepository.countByProjetId(projetId)
        val graves = incidentRepository.countByProjetIdAndGraviteIn(projetId, gravesEtMortels)
        val joursArret = incidentRepository.sumJoursArretByProjetId(projetId)
        val cnssRetard = incidentRepository.findDeclarationCnssEnRetard(LocalDate.now())
            .count { it.projet.id == projetId }.toLong()

        val incidents = incidentRepository.findByProjetIdAndStatut(projetId, StatutIncident.DECLARE) +
                incidentRepository.findByProjetIdAndStatut(projetId, StatutIncident.EN_INVESTIGATION) +
                incidentRepository.findByProjetIdAndStatut(projetId, StatutIncident.INVESTIGATION_TERMINEE) +
                incidentRepository.findByProjetIdAndStatut(projetId, StatutIncident.CLOTURE) +
                incidentRepository.findByProjetIdAndStatut(projetId, StatutIncident.BROUILLON)

        val parType = incidents.groupBy { it.typeIncident.name }.mapValues { it.value.size.toLong() }
        val parGravite = incidents.groupBy { it.gravite.name }.mapValues { it.value.size.toLong() }

        return IncidentSummaryResponse(
            totalIncidents = total,
            incidentsGraves = graves,
            totalJoursArret = joursArret,
            declarationsCnssEnRetard = cnssRetard,
            incidentsParType = parType,
            incidentsParGravite = parGravite
        )
    }

    // ==================== Declarations en retard ====================

    @Transactional(readOnly = true)
    fun findDeclarationsCnssEnRetard(): List<IncidentResponse> {
        return incidentRepository.findDeclarationCnssEnRetard(LocalDate.now())
            .map { IncidentMapper.toResponse(it) }
    }

    // ==================== Utilitaires ====================

    private fun getIncidentById(id: Long): Incident {
        return incidentRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Incident introuvable : $id") }
    }

    private fun generateReference(): String {
        val count = incidentRepository.count() + 1
        return "INC-%05d".format(count)
    }

    /**
     * ALERTE REGLEMENTAIRE — Code du Travail gabonais Art. 206
     * Declaration AT a la CNSS et a l'Inspection du Travail sous 48h calendaires.
     * Le delai court a partir de la date de l'incident.
     * Ce calcul utilise des jours calendaires (pas ouvres).
     */
    private fun calculerEcheancesReglementaires(incident: Incident) {
        incident.dateEcheanceCnss = incident.dateIncident.plusDays(2)
        incident.dateEcheanceInspectionTravail = incident.dateIncident.plusDays(2)
    }
}
