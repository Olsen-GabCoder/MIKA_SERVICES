package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.TypePrevision
import java.time.LocalDate

data class PrevisionUpdateRequest(
    val semaine: Int? = null,
    val annee: Int? = null,
    val description: String? = null,
    val type: TypePrevision? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val avancementPct: Int? = null
)
