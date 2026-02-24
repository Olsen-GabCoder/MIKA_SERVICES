package com.mikaservices.platform.modules.projet.dto.response

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class RevisionBudgetResponse(
    val id: Long,
    val projetId: Long,
    val ancienMontant: BigDecimal,
    val nouveauMontant: BigDecimal,
    val motif: String?,
    val dateRevision: LocalDate,
    val validePar: ProjetUserSummary?,
    val createdAt: LocalDateTime?
)
