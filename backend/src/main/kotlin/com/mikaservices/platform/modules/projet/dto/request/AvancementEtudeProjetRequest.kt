package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.PhaseEtude
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class AvancementEtudeProjetRequest(
    @field:NotNull
    val phase: PhaseEtude,
    @field:DecimalMin(value = "0", message = "L'avancement doit être entre 0 et 100")
    @field:DecimalMax(value = "100", message = "L'avancement doit être entre 0 et 100")
    val avancementPct: BigDecimal? = null,
    val dateDepot: LocalDate? = null,
    val etatValidation: String? = null
)
