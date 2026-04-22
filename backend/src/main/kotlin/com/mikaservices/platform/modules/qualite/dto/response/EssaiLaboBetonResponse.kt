package com.mikaservices.platform.modules.qualite.dto.response

import java.time.LocalDateTime

data class EssaiLaboBetonResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val moisReference: String,
    val nbCamionsMalaxeursVolumeCoulee: Int,
    val nbEssaisSlump: Int,
    val nbJoursCoulage: Int,
    val nbPrelevements: Int,
    val observations: String?,
    val saisiParId: Long?,
    val saisiParNom: String?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)
