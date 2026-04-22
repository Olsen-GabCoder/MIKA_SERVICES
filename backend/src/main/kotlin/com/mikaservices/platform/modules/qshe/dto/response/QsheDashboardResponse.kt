package com.mikaservices.platform.modules.qshe.dto.response

data class QsheDashboardResponse(
    val incidents: IncidentSummaryResponse,
    val actions: ActionCorrectiveSummaryResponse,
    /** Taux de frequence = (nb AT avec arret x 1 000 000) / heures travaillees. Null si heures non renseignees. */
    val tauxFrequence: Double?,
    /** Taux de gravite = (nb jours arret x 1 000) / heures travaillees. Null si heures non renseignees. */
    val tauxGravite: Double?,
    val heuresTravaillees: Long?,
    val joursDepuisDernierAT: Long?
)
