package com.mikaservices.platform.modules.projet.dto.response

import java.math.BigDecimal
import java.time.LocalDateTime

data class DqeChapitreResponse(
    val id: Long,
    val projetId: Long,
    val numero: String,
    val designation: String,
    val ordre: Int,
    val montantTotal: BigDecimal,
    val montantExecute: BigDecimal,
    val avancementPct: BigDecimal,
    val nombreLignes: Int,
    val lignes: List<DqeLigneResponse>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class DqeLigneResponse(
    val id: Long,
    val chapitreId: Long,
    val numeroPoste: String?,
    val designation: String,
    val unite: String?,
    val quantite: BigDecimal?,
    val prixUnitaire: BigDecimal?,
    val montantTotal: BigDecimal?,
    val avancementPct: BigDecimal,
    val montantExecute: BigDecimal,
    val ordre: Int,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

/** Résumé DQE pour la vue détail projet (sans toutes les lignes) */
data class DqeSummaryResponse(
    val projetId: Long,
    val nombreChapitres: Int,
    val nombreLignes: Int,
    val montantTotalDqe: BigDecimal,
    val montantExecuteTotal: BigDecimal,
    val avancementGlobalPct: BigDecimal
)
