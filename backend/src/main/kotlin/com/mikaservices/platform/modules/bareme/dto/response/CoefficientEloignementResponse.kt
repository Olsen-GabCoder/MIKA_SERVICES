package com.mikaservices.platform.modules.bareme.dto.response

import java.math.BigDecimal

data class CoefficientEloignementResponse(
    val id: Long,
    val nom: String,
    val pourcentage: BigDecimal?,
    val coefficient: BigDecimal,
    val note: String?,
    val ordreAffichage: Int
)
