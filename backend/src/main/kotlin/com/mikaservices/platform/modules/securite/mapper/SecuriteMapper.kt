package com.mikaservices.platform.modules.securite.mapper

import com.mikaservices.platform.common.enums.StatutActionPrevention
import com.mikaservices.platform.modules.projet.mapper.ProjetMapper
import com.mikaservices.platform.modules.securite.dto.response.ActionPreventionResponse
import com.mikaservices.platform.modules.securite.dto.response.IncidentResponse
import com.mikaservices.platform.modules.securite.dto.response.RisqueResponse
import com.mikaservices.platform.modules.securite.entity.ActionPrevention
import com.mikaservices.platform.modules.securite.entity.Incident
import com.mikaservices.platform.modules.securite.entity.Risque
import java.time.LocalDate

object SecuriteMapper {

    fun toIncidentResponse(entity: Incident): IncidentResponse {
        return IncidentResponse(
            id = entity.id!!,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            reference = entity.reference,
            titre = entity.titre,
            description = entity.description,
            typeIncident = entity.typeIncident,
            gravite = entity.gravite,
            statut = entity.statut,
            dateIncident = entity.dateIncident,
            heureIncident = entity.heureIncident,
            lieu = entity.lieu,
            declarePar = ProjetMapper.toUserSummary(entity.declarePar),
            nbBlesses = entity.nbBlesses,
            arretTravail = entity.arretTravail,
            nbJoursArret = entity.nbJoursArret,
            causeIdentifiee = entity.causeIdentifiee,
            mesuresImmediates = entity.mesuresImmediates,
            analyseCause = entity.analyseCause,
            nbActionsPrevention = entity.actionsPrevention.size,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toRisqueResponse(entity: Risque): RisqueResponse {
        return RisqueResponse(
            id = entity.id!!,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            titre = entity.titre,
            description = entity.description,
            niveau = entity.niveau,
            probabilite = entity.probabilite,
            impact = entity.impact,
            zoneConcernee = entity.zoneConcernee,
            mesuresPrevention = entity.mesuresPrevention,
            actif = entity.actif,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toActionPreventionResponse(entity: ActionPrevention): ActionPreventionResponse {
        val enRetard = entity.dateEcheance != null &&
                entity.dateEcheance!!.isBefore(LocalDate.now()) &&
                entity.statut !in listOf(StatutActionPrevention.REALISEE, StatutActionPrevention.VERIFIEE, StatutActionPrevention.ANNULEE)

        return ActionPreventionResponse(
            id = entity.id!!,
            incidentId = entity.incident?.id,
            incidentReference = entity.incident?.reference,
            titre = entity.titre,
            description = entity.description,
            statut = entity.statut,
            responsable = ProjetMapper.toUserSummary(entity.responsable),
            dateEcheance = entity.dateEcheance,
            dateRealisation = entity.dateRealisation,
            commentaireVerification = entity.commentaireVerification,
            enRetard = enRetard,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
