package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.TypePrevision
import java.time.LocalDate
import java.time.LocalDateTime

data class PrevisionResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val semaine: Int?,
    val annee: Int,
    val description: String?,
    val type: TypePrevision,
    val dateDebut: LocalDate?,
    val dateFin: LocalDate?,
    val avancementPct: Int?,
    val createdAt: LocalDateTime?
)
