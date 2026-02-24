package com.mikaservices.platform.modules.budget.dto.response

import com.mikaservices.platform.common.enums.StatutDepense
import com.mikaservices.platform.common.enums.TypeDepense
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class DepenseResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val reference: String,
    val libelle: String,
    val type: TypeDepense,
    val montant: BigDecimal,
    val dateDepense: LocalDate,
    val statut: StatutDepense,
    val fournisseur: String?,
    val numeroFacture: String?,
    val observations: String?,
    val validePar: ProjetUserSummary?,
    val dateValidation: LocalDate?,
    val createdAt: LocalDateTime?
)

data class BudgetSummaryResponse(
    val projetId: Long,
    val projetNom: String,
    val montantHT: BigDecimal?,
    val montantRevise: BigDecimal?,
    val totalDepenses: BigDecimal,
    val budgetRestant: BigDecimal,
    val tauxConsommation: BigDecimal,
    val depensesParType: Map<String, BigDecimal>
)
