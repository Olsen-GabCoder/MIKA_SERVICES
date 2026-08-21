package com.mikaservices.platform.modules.materiel.dto.response

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class ConsommationCarburantResponse(
    val id: Long,
    val enginId: Long,
    val datePlein: LocalDate,
    val quantiteLitres: BigDecimal,
    val coutTotal: BigDecimal?,
    val heuresCompteurAuPlein: Int?,
    val pleinPar: String?,
    val commentaire: String?,
    val photoUrl: String?,
    val createdAt: LocalDateTime?
)
