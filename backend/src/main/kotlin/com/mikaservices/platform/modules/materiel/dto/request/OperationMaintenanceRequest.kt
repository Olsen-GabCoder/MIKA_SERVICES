package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class OperationMaintenanceCreateRequest(
    @field:NotNull(message = "Le type d'operation est obligatoire")
    val typeOperation: TypeOperationMaintenance,
    val description: String? = null,
    val echeanceDate: LocalDate? = null,
    val echeanceHeures: Int? = null,
    val coutEstime: BigDecimal? = null,
    val executePar: String? = null
)

data class OperationMaintenanceUpdateRequest(
    val typeOperation: TypeOperationMaintenance? = null,
    val statut: StatutMaintenance? = null,
    val description: String? = null,
    val echeanceDate: LocalDate? = null,
    val echeanceHeures: Int? = null,
    val coutEstime: BigDecimal? = null,
    val coutReel: BigDecimal? = null,
    val executePar: String? = null,
    val dateRealisation: LocalDate? = null
)
