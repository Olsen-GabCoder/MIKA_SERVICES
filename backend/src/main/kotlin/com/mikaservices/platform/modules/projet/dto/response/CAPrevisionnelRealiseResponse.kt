package com.mikaservices.platform.modules.projet.dto.response

import java.math.BigDecimal

data class CAPrevisionnelRealiseResponse(
    val id: Long,
    val projetId: Long,
    val mois: Int,
    val annee: Int,
    val caPrevisionnel: BigDecimal,
    val caRealise: BigDecimal,
    val ecart: BigDecimal,
    val avancementCumule: BigDecimal
)
