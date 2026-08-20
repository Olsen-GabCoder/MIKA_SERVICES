package com.mikaservices.platform.modules.materiel.dto.request

import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class ReleveCompteurCreateRequest(
    @field:NotNull val dateReleve: LocalDate,
    @field:NotNull val valeurHeures: Int,
    val relevePar: String? = null,
    val commentaire: String? = null,
    /** Idempotence offline : UUID client, unique en base. */
    val clientRequestId: String? = null
)
