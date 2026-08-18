package com.mikaservices.platform.modules.user.dto.response

import java.time.LocalDate

/** Statistiques agrégées des effectifs pour le tableau de bord Utilisateurs & Organisation. */
data class UserStatsResponse(
    val total: Long,
    val actifs: Long,
    val inactifs: Long,
    val verrouilles: Long,
    val sansRole: Long,
    val departementsSansResponsable: List<String>,
    val embauches90Jours: Long,
    val embauchesRecentes: List<RecentHireResponse>,
    val parStatut: List<CountByLabelResponse>,
    val parDepartement: List<CountByLabelResponse>,
    val parRole: List<CountByLabelResponse>
)

data class RecentHireResponse(
    val id: Long,
    val nom: String,
    val prenom: String,
    val matricule: String,
    val departement: String?,
    val role: String?,
    val dateEmbauche: LocalDate?
)

data class CountByLabelResponse(
    val label: String,
    val count: Long
)
