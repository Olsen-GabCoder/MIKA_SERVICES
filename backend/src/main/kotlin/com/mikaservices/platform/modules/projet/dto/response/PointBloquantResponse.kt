package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import java.time.LocalDate
import java.time.LocalDateTime

data class PointBloquantResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val titre: String,
    val description: String?,
    val priorite: Priorite,
    val statut: StatutPointBloquant,
    val detectePar: ProjetUserSummary?,
    val assigneA: ProjetUserSummary?,
    val dateDetection: LocalDate,
    val dateResolution: LocalDate?,
    val actionCorrective: String?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
