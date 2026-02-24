package com.mikaservices.platform.modules.securite.dto.response

import com.mikaservices.platform.common.enums.*
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class IncidentResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val reference: String,
    val titre: String,
    val description: String?,
    val typeIncident: TypeIncident,
    val gravite: GraviteIncident,
    val statut: StatutIncident,
    val dateIncident: LocalDate,
    val heureIncident: LocalTime?,
    val lieu: String?,
    val declarePar: ProjetUserSummary?,
    val nbBlesses: Int,
    val arretTravail: Boolean,
    val nbJoursArret: Int,
    val causeIdentifiee: String?,
    val mesuresImmediates: String?,
    val analyseCause: String?,
    val nbActionsPrevention: Int,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class RisqueResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val titre: String,
    val description: String?,
    val niveau: NiveauRisque,
    val probabilite: Int?,
    val impact: Int?,
    val zoneConcernee: String?,
    val mesuresPrevention: String?,
    val actif: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class ActionPreventionResponse(
    val id: Long,
    val incidentId: Long?,
    val incidentReference: String?,
    val titre: String,
    val description: String?,
    val statut: StatutActionPrevention,
    val responsable: ProjetUserSummary?,
    val dateEcheance: LocalDate?,
    val dateRealisation: LocalDate?,
    val commentaireVerification: String?,
    val enRetard: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class SecuriteSummaryResponse(
    val totalIncidents: Long,
    val incidentsGraves: Long,
    val totalJoursArret: Long,
    val incidentsParGravite: Map<String, Long>,
    val risquesActifs: Long,
    val risquesCritiques: Long,
    val actionsEnRetard: Int
)
