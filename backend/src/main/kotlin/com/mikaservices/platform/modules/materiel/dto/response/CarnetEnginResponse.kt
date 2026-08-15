package com.mikaservices.platform.modules.materiel.dto.response

import java.time.LocalDateTime

data class CarnetEnginEntry(
    val type: String,
    val date: LocalDateTime,
    val titre: String,
    val detail: String? = null,
    val couleur: String = "#2563EB"
)

data class CarnetEnginResponse(
    val enginId: Long,
    val enginCode: String,
    val entries: List<CarnetEnginEntry>
)
