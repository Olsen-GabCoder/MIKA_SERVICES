package com.mikaservices.platform.modules.materiel.event

import com.mikaservices.platform.common.enums.GraviteIncident

data class IncidentNotificationEvent(
    val incidentId: Long,
    val enginId: Long,
    val enginCode: String,
    val enginNom: String,
    val gravite: GraviteIncident,
    val typeIncident: String,
    val description: String?,
    /** Chantier de l'engin au moment de l'incident (affectation EN_COURS), null si dépôt */
    val projetNom: String?,
    val projetResponsableId: Long?,
)
