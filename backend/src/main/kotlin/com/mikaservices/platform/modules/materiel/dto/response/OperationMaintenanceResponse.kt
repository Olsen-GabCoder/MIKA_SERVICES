package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class OperationMaintenanceResponse(
    val id: Long,
    val enginId: Long,
    val enginCode: String,
    val enginNom: String? = null,
    val typeOperation: TypeOperationMaintenance,
    val statut: StatutMaintenance,
    val description: String?,
    val echeanceDate: LocalDate?,
    val echeanceHeures: Int?,
    val coutEstime: BigDecimal?,
    val coutReel: BigDecimal?,
    val executePar: String?,
    val dateRealisation: LocalDate?,
    val incidentSourceId: Long?,
    val planMaintenanceId: Long?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
