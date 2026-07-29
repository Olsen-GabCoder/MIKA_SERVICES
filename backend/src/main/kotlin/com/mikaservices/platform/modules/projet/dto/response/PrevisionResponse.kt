package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
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
    val type: TypePrevision?,
    val dateDebut: LocalDate?,
    val dateFin: LocalDate?,
    val dateEcheance: LocalDate?,
    val avancementPct: Int?,
    val statut: StatutTache?,
    val priorite: Priorite?,
    val assigneNom: String?,
    val enRetard: Boolean?,
    val createdAt: LocalDateTime?
)
