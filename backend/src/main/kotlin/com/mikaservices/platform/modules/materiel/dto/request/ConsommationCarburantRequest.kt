package com.mikaservices.platform.modules.materiel.dto.request

import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class ConsommationCarburantCreateRequest(
    @field:NotNull val datePlein: LocalDate,
    @field:NotNull val quantiteLitres: BigDecimal,
    val coutTotal: BigDecimal? = null,
    val heuresCompteurAuPlein: Int? = null,
    val pleinPar: String? = null,
    val commentaire: String? = null
)
