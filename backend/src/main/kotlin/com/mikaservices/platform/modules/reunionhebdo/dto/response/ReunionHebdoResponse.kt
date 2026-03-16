package com.mikaservices.platform.modules.reunionhebdo.dto.response

import com.mikaservices.platform.common.enums.StatutReunion
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class ReunionHebdoResponse(
    val id: Long,
    val dateReunion: LocalDate,
    val lieu: String?,
    val heureDebut: LocalTime?,
    val heureFin: LocalTime?,
    val ordreDuJour: String?,
    val statut: StatutReunion,
    val divers: String?,
    val redacteur: ReunionUserSummary?,
    val participants: List<ParticipantReunionResponse> = emptyList(),
    val pointsProjet: List<PointProjetPVResponse> = emptyList(),
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class ReunionHebdoSummaryResponse(
    val id: Long,
    val dateReunion: LocalDate,
    val lieu: String?,
    val heureDebut: LocalTime?,
    val heureFin: LocalTime?,
    val statut: StatutReunion,
    val redacteurNom: String?,
    val nombreParticipants: Int = 0,
    val nombrePointsProjet: Int = 0
)

data class ParticipantReunionResponse(
    val id: Long,
    /** Null si participant saisi manuellement (hors compte appli). */
    val userId: Long?,
    val nom: String,
    val prenom: String,
    val email: String,
    val initiales: String?,
    val telephone: String?,
    val present: Boolean,
    /** True si présence issue d’une saisie manuelle (pas d’utilisateur lié). */
    val manuel: Boolean = false
)

data class PointProjetPVResponse(
    val id: Long,
    val projetId: Long,
    val projetCode: String,
    val projetNom: String,
    val chefProjetNom: String?,
    val avancementPhysiquePct: java.math.BigDecimal?,
    val avancementFinancierPct: java.math.BigDecimal?,
    val delaiConsommePct: java.math.BigDecimal?,
    val resumeTravauxPrevisions: String?,
    val pointsBloquantsResume: String?,
    val besoinsMateriel: String?,
    val besoinsHumain: String?,
    val propositionsAmelioration: String?,
    val ordreAffichage: Int
)

data class ReunionUserSummary(
    val id: Long,
    val nom: String,
    val prenom: String,
    val email: String
)
