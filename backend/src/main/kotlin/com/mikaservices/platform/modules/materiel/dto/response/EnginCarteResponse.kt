package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin

data class EnginCarteResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeEngin,
    val statut: StatutEngin,
    val marque: String?,
    val chantierNom: String?,
    val latitude: Double,
    val longitude: Double
)
