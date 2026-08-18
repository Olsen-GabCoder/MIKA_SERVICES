package com.mikaservices.platform.modules.materiel.dto.response

import java.math.BigDecimal
import java.time.LocalDate

data class LigneCoutResponse(
    val type: String,          // MAINTENANCE, CARBURANT, LOCATION, ACQUISITION
    val description: String,
    val date: LocalDate?,
    val montant: BigDecimal
)

data class CoutEnginResponse(
    val enginId: Long,
    val totalMaintenance: BigDecimal,
    val totalCarburant: BigDecimal,
    val totalLocation: BigDecimal,
    val valeurAcquisition: BigDecimal?,
    val tco: BigDecimal,
    val lignes: List<LigneCoutResponse>
)
