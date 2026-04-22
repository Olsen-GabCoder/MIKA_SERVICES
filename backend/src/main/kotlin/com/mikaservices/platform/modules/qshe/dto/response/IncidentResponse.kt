package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class IncidentResponse(
    val id: Long,
    val reference: String,
    val titre: String,
    val description: String?,
    val typeIncident: TypeIncident,
    val gravite: GraviteIncident,
    val statut: StatutIncident,
    val dateIncident: LocalDate,
    val heureIncident: LocalTime?,
    val lieu: String?,
    val zoneChantier: String?,
    val latitude: Double?,
    val longitude: Double?,
    val projetId: Long,
    val projetNom: String,
    val sousProjetId: Long?,
    val sousProjetNom: String?,
    val declareParId: Long?,
    val declareParNom: String?,
    val descriptionCirconstances: String?,
    val activiteEnCours: String?,
    val equipementImplique: String?,
    val epiPortes: String?,
    val causeImmediate: String?,
    val causeRacine: String?,
    val mesuresConservatoires: String?,
    val dateEcheanceCnss: LocalDate?,
    val declarationCnssEffectuee: Boolean,
    val dateDeclarationCnss: LocalDate?,
    val declarationCnssEnRetard: Boolean,
    val dateEcheanceInspectionTravail: LocalDate?,
    val declarationInspectionEffectuee: Boolean,
    val dateDeclarationInspection: LocalDate?,
    val declarationInspectionEnRetard: Boolean,
    val nbVictimes: Int,
    val nbTemoins: Int,
    val nbPiecesJointes: Int,
    val victimes: List<VictimeResponse>,
    val temoins: List<TemoinResponse>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class VictimeResponse(
    val id: Long,
    val userId: Long?,
    val nom: String,
    val prenom: String,
    val poste: String?,
    val entreprise: String?,
    val anciennete: String?,
    val typeContrat: String?,
    val natureLesion: String?,
    val localisationCorporelle: LocalisationCorporelle?,
    val descriptionBlessure: String?,
    val arretTravail: Boolean,
    val nbJoursArret: Int,
    val hospitalisation: Boolean,
    val declarationCnss: Boolean,
    val dateDeclarationCnss: LocalDate?
)

data class TemoinResponse(
    val id: Long,
    val nom: String,
    val prenom: String?,
    val telephone: String?,
    val email: String?,
    val entreprise: String?,
    val temoignage: String?
)

data class IncidentSummaryResponse(
    val totalIncidents: Long,
    val incidentsGraves: Long,
    val totalJoursArret: Long,
    val declarationsCnssEnRetard: Long,
    val incidentsParType: Map<String, Long>,
    val incidentsParGravite: Map<String, Long>
)
