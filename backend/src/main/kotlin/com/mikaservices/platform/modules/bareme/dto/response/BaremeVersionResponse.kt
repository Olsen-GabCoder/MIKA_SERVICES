package com.mikaservices.platform.modules.bareme.dto.response

import java.time.LocalDateTime

/** Réponse pour l'endpoint derniere-mise-a-jour (date du dernier import barème). */
data class BaremeVersionResponse(
    val derniereMiseAJour: LocalDateTime?
)
