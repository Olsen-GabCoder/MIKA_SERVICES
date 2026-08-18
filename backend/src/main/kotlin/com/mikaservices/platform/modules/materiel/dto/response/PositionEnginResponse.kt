package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.modules.materiel.entity.SourcePosition
import java.time.Instant

data class PositionEnginResponse(
    val id: Long,
    val enginId: Long,
    val latitude: Double,
    val longitude: Double,
    val source: SourcePosition,
    val precisionMetres: Int?,
    val chantierNom: String?,
    val confirmePar: String?,
    val horodatage: Instant
)
