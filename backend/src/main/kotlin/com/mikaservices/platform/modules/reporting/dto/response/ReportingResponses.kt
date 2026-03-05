package com.mikaservices.platform.modules.reporting.dto.response

import java.math.BigDecimal

data class GlobalDashboardResponse(
    val projets: ProjetStats,
    val chantiers: ChantierStats,
    val budget: BudgetStats,
    val planning: PlanningStats,
    val qualite: QualiteStats,
    val securite: SecuriteStats,
    val materiel: MaterielStats,
    val weeklyProgress: WeeklyProgressStats
)

data class ProjetStats(
    val total: Long,
    val enCours: Long,
    val termines: Long,
    val enRetard: Long,
    val montantTotal: BigDecimal,
    val avancementMoyen: Double,
    val parStatut: Map<String, Long>
)

data class ChantierStats(
    val total: Long,
    val actifs: Long,
    val termines: Long
)

data class BudgetStats(
    val budgetTotalPrevu: BigDecimal,
    val depensesTotales: BigDecimal,
    val ecart: BigDecimal,
    val tauxConsommation: Double
)

data class PlanningStats(
    val tachesTotal: Long,
    val tachesTerminees: Long,
    val tachesEnCours: Long,
    val tachesEnRetard: Long,
    val tauxAvancement: Double
)

data class QualiteStats(
    val controlesTotal: Long,
    val tauxConformite: Double,
    val ncOuvertes: Long
)

data class SecuriteStats(
    val incidentsTotal: Long,
    val incidentsGraves: Long,
    val joursArretTotal: Long,
    val risquesCritiques: Long
)

data class MaterielStats(
    val enginsTotal: Long,
    val enginsDisponibles: Long,
    val materiauxStockBas: Long
)

data class ProjetReportResponse(
    val projetId: Long,
    val projetNom: String,
    val statut: String,
    val budget: BudgetStats,
    val planning: PlanningStats,
    val qualite: QualiteStats,
    val securite: SecuriteStats,
    val nbChantiers: Long,
    val nbSousProjets: Long
)

data class EvolutionMensuelle(
    val mois: String,
    val depenses: BigDecimal,
    val incidents: Long,
    val tachesTerminees: Long
)

data class WeeklyProgressStats(
    val semaineActuelle: Int,
    val anneeActuelle: Int,
    val weeks: List<WeekSummary>
)

data class WeekSummary(
    val semaine: Int,
    val annee: Int,
    val label: String,
    val total: Long,
    val terminees: Long,
    val enCours: Long,
    val nonCommencees: Long,
    val avancementMoyen: Double,
    val isCurrent: Boolean
)
