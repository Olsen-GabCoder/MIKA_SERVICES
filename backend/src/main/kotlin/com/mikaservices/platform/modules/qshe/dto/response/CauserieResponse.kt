package com.mikaservices.platform.modules.qshe.dto.response

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class CauserieResponse(
    val id: Long, val reference: String, val sujet: String, val description: String?,
    val dateCauserie: LocalDate, val heureDebut: LocalTime?, val dureeMinutes: Int?,
    val lieu: String?, val projetId: Long, val projetNom: String,
    val animateurId: Long?, val animateurNom: String?,
    val observations: String?, val nbParticipants: Int,
    val participants: List<ParticipantResponse>,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class ParticipantResponse(val id: Long, val nom: String, val prenom: String, val matricule: String?)

data class CauserieSummaryResponse(
    val totalCauseries: Long, val causeriesCeMois: Long,
    val participantsMoyens: Double
)
