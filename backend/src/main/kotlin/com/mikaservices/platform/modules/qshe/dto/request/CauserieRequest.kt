package com.mikaservices.platform.modules.qshe.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.time.LocalTime

data class CauserieCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotBlank @field:Size(max = 500) val sujet: String,
    val description: String? = null,
    @field:NotNull val dateCauserie: LocalDate,
    val heureDebut: LocalTime? = null,
    val dureeMinutes: Int? = null,
    val lieu: String? = null,
    val animateurId: Long? = null,
    val participantIds: List<Long> = emptyList()
)

data class CauserieUpdateRequest(
    val sujet: String? = null,
    val description: String? = null,
    val dateCauserie: LocalDate? = null,
    val heureDebut: LocalTime? = null,
    val dureeMinutes: Int? = null,
    val lieu: String? = null,
    val animateurId: Long? = null,
    val observations: String? = null,
    val participantIds: List<Long>? = null
)
