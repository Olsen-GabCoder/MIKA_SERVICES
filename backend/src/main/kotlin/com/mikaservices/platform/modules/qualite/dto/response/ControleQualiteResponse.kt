package com.mikaservices.platform.modules.qualite.dto.response

import com.mikaservices.platform.common.enums.StatutControleQualite
import com.mikaservices.platform.common.enums.TypeControle
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import java.time.LocalDate
import java.time.LocalDateTime

data class ControleQualiteResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val reference: String,
    val titre: String,
    val description: String?,
    val typeControle: TypeControle,
    val statut: StatutControleQualite,
    val inspecteur: ProjetUserSummary?,
    val datePlanifiee: LocalDate?,
    val dateRealisation: LocalDate?,
    val zoneControlee: String?,
    val criteresVerification: String?,
    val observations: String?,
    val noteGlobale: Int?,
    val nbNonConformites: Int,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class QualiteSummaryResponse(
    val totalControles: Long,
    val controlesConformes: Long,
    val controlesNonConformes: Long,
    val controlesPlanifies: Long,
    val controlesEnCours: Long,
    val ncOuvertes: Long,
    val ncParGravite: Map<String, Long>,
    val tauxConformite: Double
)
