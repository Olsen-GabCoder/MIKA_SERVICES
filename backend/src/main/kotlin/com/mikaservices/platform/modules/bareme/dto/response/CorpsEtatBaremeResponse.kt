package com.mikaservices.platform.modules.bareme.dto.response

data class CorpsEtatBaremeResponse(
    val id: Long,
    val code: String,
    val libelle: String,
    val ordreAffichage: Int
)
