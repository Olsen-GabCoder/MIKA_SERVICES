package com.mikaservices.platform.modules.qualite.dto.response

import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import java.time.LocalDate
import java.time.LocalDateTime

data class AgrementMarcheResponse(
    val id: Long,
    val reference: String,
    val objet: String,
    val titre: String,
    val statut: StatutAgrement,
    val description: String?,
    val dateSoumission: LocalDate?,
    val dateDecision: LocalDate?,
    val projetId: Long,
    val projetNom: String,
    val decideurId: Long?,
    val decideurNom: String?,
    val observations: String?,
    val moisReference: String,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)

data class AgrementSummaryResponse(
    val total: Long,
    val parStatut: Map<StatutAgrement, Long>,
)
