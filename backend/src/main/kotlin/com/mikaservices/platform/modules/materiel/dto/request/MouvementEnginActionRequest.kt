package com.mikaservices.platform.modules.materiel.dto.request

/** Corps optionnel pour confirmation / annulation (observations, payload JSON métier). */
data class MouvementEnginActionRequest(
    val commentaire: String? = null,
    val payloadJson: String? = null,
)
