package com.mikaservices.platform.modules.materiel.dto.request

data class DemandeMaterielCommentaireRequest(
    val commentaire: String? = null,
)

data class DemandeMaterielRejetRequest(
    val commentaire: String,
)

data class DemandeMaterielCommanderRequest(
    val commandeId: Long? = null,
)
