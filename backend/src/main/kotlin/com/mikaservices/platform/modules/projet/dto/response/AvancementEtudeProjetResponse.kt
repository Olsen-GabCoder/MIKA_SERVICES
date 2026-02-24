package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.PhaseEtude
import java.math.BigDecimal
import java.time.LocalDate

data class AvancementEtudeProjetResponse(
    val id: Long,
    val projetId: Long,
    val phase: PhaseEtude,
    val avancementPct: BigDecimal?,
    val dateDepot: LocalDate?,
    val etatValidation: String?
)
