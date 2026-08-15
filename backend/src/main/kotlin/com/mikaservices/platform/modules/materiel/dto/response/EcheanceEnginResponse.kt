package com.mikaservices.platform.modules.materiel.dto.response

import java.time.LocalDate

data class EcheanceEnginResponse(
    val date: LocalDate,
    val titre: String,
    val detail: String?,
    val couleur: String,
    val enginId: Long?,
    val enginCode: String?,
    val sourceType: String,  // MAINTENANCE, DOCUMENT, AFFECTATION
    val sourceId: Long? = null
)
