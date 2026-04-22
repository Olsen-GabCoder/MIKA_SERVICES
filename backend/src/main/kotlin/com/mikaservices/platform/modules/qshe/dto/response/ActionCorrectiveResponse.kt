package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.PrioriteAction
import com.mikaservices.platform.modules.qshe.enums.SourceAction
import com.mikaservices.platform.modules.qshe.enums.StatutAction
import com.mikaservices.platform.modules.qshe.enums.TypeAction
import java.time.LocalDate
import java.time.LocalDateTime

data class ActionCorrectiveResponse(
    val id: Long,
    val reference: String,
    val titre: String,
    val description: String?,
    val typeAction: TypeAction,
    val priorite: PrioriteAction,
    val statut: StatutAction,
    val sourceType: SourceAction,
    val sourceId: Long,
    val sourceReference: String?,
    val projetId: Long,
    val projetNom: String,
    val responsableId: Long?,
    val responsableNom: String?,
    val verificateurId: Long?,
    val verificateurNom: String?,
    val dateEcheance: LocalDate?,
    val dateRealisation: LocalDate?,
    val dateVerification: LocalDate?,
    val dateCloture: LocalDate?,
    val descriptionAction: String?,
    val resultatVerification: String?,
    val efficace: Boolean?,
    val commentaire: String?,
    val enRetard: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class ActionCorrectiveSummaryResponse(
    val totalActions: Long,
    val actionsEnRetard: Long,
    val actionsOuvertes: Long,
    val actionsVerifiees: Long,
    val tauxCloture: Double,
    val parType: Map<String, Long>,
    val parPriorite: Map<String, Long>
)
