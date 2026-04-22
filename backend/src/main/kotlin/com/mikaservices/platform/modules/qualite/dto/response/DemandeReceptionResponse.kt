package com.mikaservices.platform.modules.qualite.dto.response

import com.mikaservices.platform.modules.qualite.enums.NatureReception
import com.mikaservices.platform.modules.qualite.enums.SousTypeReception
import com.mikaservices.platform.modules.qualite.enums.StatutReception
import java.time.LocalDate
import java.time.LocalDateTime

data class DemandeReceptionResponse(
    val id: Long,
    val reference: String,
    val titre: String,
    val nature: NatureReception,
    val sousType: SousTypeReception,
    val statut: StatutReception,
    val description: String?,
    val zoneOuvrage: String?,
    val dateDemande: LocalDate?,
    val dateDecision: LocalDate?,
    val projetId: Long,
    val projetNom: String,
    val demandeurId: Long?,
    val demandeurNom: String?,
    val decideurId: Long?,
    val decideurNom: String?,
    val observations: String?,
    val moisReference: String,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)

/** Résumé par nature × sous-type pour un mois donné (synthèse mensuelle) */
data class ReceptionSummaryResponse(
    val nature: NatureReception,
    val sousType: SousTypeReception,
    val total: Long,
    val parStatut: Map<StatutReception, Long>,
)
