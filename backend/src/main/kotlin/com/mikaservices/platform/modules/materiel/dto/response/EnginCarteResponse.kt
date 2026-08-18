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
    val longitude: Double,
    /** Horodatage de la derniere position GPS reelle (null si position deduite du chantier) */
    val horodatage: java.time.Instant? = null,
    /** Source de la position : GPS_AUTO, QR_SCAN, MANUEL ou CHANTIER (deduite de l'affectation) */
    val sourcePosition: String? = null
)
