package com.mikaservices.platform.modules.reunionhebdo.dto.request

import com.mikaservices.platform.common.enums.StatutReunion
import jakarta.validation.constraints.NotNull
import java.time.LocalDate
import java.time.LocalTime

data class ReunionHebdoCreateRequest(
    @field:NotNull(message = "La date de réunion est obligatoire")
    val dateReunion: LocalDate,

    val lieu: String? = null,
    val heureDebut: LocalTime? = null,
    val heureFin: LocalTime? = null,
    val ordreDuJour: String? = null,
    val statut: StatutReunion = StatutReunion.BROUILLON,
    val divers: String? = null,
    val redacteurId: Long? = null,
    val participants: List<ParticipantReunionRequest> = emptyList()
)

/**
 * Participant soit lié à un utilisateur ([userId]), soit saisi à la main ([nomManuel] + [prenomManuel]).
 */
data class ParticipantReunionRequest(
    val userId: Long? = null,
    val nomManuel: String? = null,
    val prenomManuel: String? = null,
    val initiales: String? = null,
    val telephone: String? = null,
    val present: Boolean = true
)
