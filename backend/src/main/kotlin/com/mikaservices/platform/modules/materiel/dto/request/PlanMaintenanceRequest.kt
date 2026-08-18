package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class PlanMaintenanceCreateRequest(
    @field:NotBlank(message = "Le titre est obligatoire")
    @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    @field:NotNull(message = "Le type d'opération est obligatoire")
    val typeOperation: TypeOperationMaintenance,
    @field:Min(1) val intervalleJours: Int? = null,
    @field:Min(1) val intervalleHeures: Int? = null,
    @field:Min(1) val intervalleKm: Int? = null,
    @field:Min(1) val seuilAlerte: Int = 30
)

data class PlanMaintenanceUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val typeOperation: TypeOperationMaintenance? = null,
    val intervalleJours: Int? = null,
    val intervalleHeures: Int? = null,
    val intervalleKm: Int? = null,
    val seuilAlerte: Int? = null,
    val actif: Boolean? = null
)
