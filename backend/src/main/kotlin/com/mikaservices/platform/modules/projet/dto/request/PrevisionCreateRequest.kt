package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.TypePrevision
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class PrevisionCreateRequest(
    val semaine: Int? = null,
    @field:NotNull(message = "L'année est obligatoire")
    val annee: Int,
    val description: String? = null,
    val type: TypePrevision? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val avancementPct: Int? = null
)
