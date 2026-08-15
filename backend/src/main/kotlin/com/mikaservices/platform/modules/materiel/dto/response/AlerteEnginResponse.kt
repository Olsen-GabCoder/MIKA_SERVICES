package com.mikaservices.platform.modules.materiel.dto.response

data class AlerteEnginResponse(
    val niveau: String,       // CRITIQUE, HAUTE, NORMALE, BASSE, INFO
    val titre: String,
    val detail: String,
    val enginId: Long?,
    val enginCode: String?,
    val couleur: String,      // hex color
    val pulse: Boolean = false,
    val sourceType: String,   // MAINTENANCE, INCIDENT, DOCUMENT, ENGIN
    val sourceId: Long? = null
)
