package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.PhaseEtude
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class AvancementEtudeProjetRequest(
    @field:NotNull
    val phase: PhaseEtude,
    val avancementPct: BigDecimal? = null,
    val dateDepot: LocalDate? = null,
    val etatValidation: String? = null
)
