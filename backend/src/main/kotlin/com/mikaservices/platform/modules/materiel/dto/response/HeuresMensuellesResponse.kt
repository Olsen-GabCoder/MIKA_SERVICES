package com.mikaservices.platform.modules.materiel.dto.response

data class HeuresMensuellesResponse(
    val enginId: Long,
    val mois: List<HeuresMois>
)

data class HeuresMois(
    val mois: String,     // "2026-01", "2026-02", etc.
    val label: String,    // "Jan", "Fev", etc.
    val heures: Int       // heures d'utilisation du mois
)
