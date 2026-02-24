package com.mikaservices.platform.modules.projet.dto.request

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

data class CAPrevisionnelRealiseRequest(
    @field:NotNull
    @field:Min(1) @field:Max(12)
    val mois: Int,

    @field:NotNull
    @field:Min(2000) @field:Max(2100)
    val annee: Int,

    val caPrevisionnel: BigDecimal? = null,
    val caRealise: BigDecimal? = null
)
