package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.StatutMouvementEngin
import java.time.LocalDateTime

data class MouvementEnginResponse(
    val id: Long,
    val enginId: Long,
    val enginCode: String,
    val enginNom: String,
    val projetOrigineId: Long?,
    val projetOrigineNom: String?,
    val projetDestinationId: Long,
    val projetDestinationNom: String,
    val initiateurUserId: Long,
    val initiateurNom: String,
    val statut: StatutMouvementEngin,
    val dateDemande: LocalDateTime,
    val dateDepartConfirmee: LocalDateTime?,
    val dateReceptionConfirmee: LocalDateTime?,
    val commentaire: String?,
    val validePar: String?,
    val dateValidation: LocalDateTime?,
    val motifRejet: String?,
    val receptionAvecReserves: Boolean,
    val receptionParCodeManuel: Boolean,
    val incidentReceptionId: Long?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)

/** Bon de transfert : tokens de réception, exposés UNIQUEMENT via l'endpoint /bon (jamais en liste). */
data class TransfertBonResponse(
    val mouvementId: Long,
    val qrToken: String,
    val codeReception: String,
)
