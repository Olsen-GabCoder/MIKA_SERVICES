package com.mikaservices.platform.modules.sallereunion.dto

import java.time.LocalDateTime

data class SalleReunionResponse(
    val id: Long,
    val roomName: String,
    val libelle: String,
    val ouverte: Boolean,
    val dateOuverture: LocalDateTime?,
    val ouvertePar: UserSummary?,
    val dateFermeture: LocalDateTime?,
    val fermeePar: UserSummary?,
    val updatedAt: LocalDateTime
)
