package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.modules.materiel.entity.SourcePosition
import jakarta.validation.constraints.NotNull

data class PositionEnginCreateRequest(
    @field:NotNull(message = "La latitude est obligatoire")
    val latitude: Double,
    @field:NotNull(message = "La longitude est obligatoire")
    val longitude: Double,
    val source: SourcePosition = SourcePosition.MANUEL,
    val precisionMetres: Int? = null,
    val chantierNom: String? = null,
    val confirmePar: String? = null,
    /** Idempotence offline : UUID client, unique en base. */
    val clientRequestId: String? = null
)
