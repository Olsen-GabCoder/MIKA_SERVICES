package com.mikaservices.platform.modules.qualite.dto.response

import java.time.LocalDateTime

data class LeveeTopoResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val moisReference: String,
    val nbProfilsImplantes: Int,
    val nbProfilsReceptionnes: Int,
    val nbControlesRealises: Int,
    val observations: String?,
    val saisiParId: Long?,
    val saisiParNom: String?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)
