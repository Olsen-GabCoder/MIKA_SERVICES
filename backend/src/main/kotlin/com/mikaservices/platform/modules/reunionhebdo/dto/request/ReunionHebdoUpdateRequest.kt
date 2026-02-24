package com.mikaservices.platform.modules.reunionhebdo.dto.request

import com.mikaservices.platform.common.enums.StatutReunion
import java.time.LocalDate
import java.time.LocalTime

data class ReunionHebdoUpdateRequest(
    val dateReunion: LocalDate? = null,
    val lieu: String? = null,
    val heureDebut: LocalTime? = null,
    val heureFin: LocalTime? = null,
    val ordreDuJour: String? = null,
    val statut: StatutReunion? = null,
    val divers: String? = null,
    val redacteurId: Long? = null,
    val participants: List<ParticipantReunionRequest>? = null
)
