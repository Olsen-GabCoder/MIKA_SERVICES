package com.mikaservices.platform.modules.planning.dto.response

data class ProjetPlanningStatsResponse(
    val projetId: Long,
    val projetNom: String,
    val ville: String?,
    val total: Long,
    val aFaire: Long,
    val enCours: Long,
    val enAttente: Long,
    val terminees: Long,
    val annulees: Long,
    val enRetard: Long,
    val avancement: Int // pourcentage moyen
)
