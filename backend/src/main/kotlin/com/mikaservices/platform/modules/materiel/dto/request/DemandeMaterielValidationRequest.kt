package com.mikaservices.platform.modules.materiel.dto.request

import jakarta.validation.constraints.NotNull

data class DemandeMaterielValidationRequest(
    @field:NotNull(message = "Indiquez si la demande est approuvée")
    val approuve: Boolean?,
    val commentaire: String? = null,
)

data class DemandeMaterielCommentaireRequest(
    val commentaire: String? = null,
)

data class DemandeMaterielRejetRequest(
    val commentaire: String,
)

data class DemandeMaterielCommanderRequest(
    val commandeId: Long? = null,
)
