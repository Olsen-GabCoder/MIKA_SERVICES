package com.mikaservices.platform.modules.materiel.dto.request

import jakarta.validation.constraints.NotNull

data class MouvementEnginCreateRequest(
    @field:NotNull(message = "L'engin est obligatoire")
    val enginId: Long?,

    /** Chantier source ; null si départ depuis le dépôt (engin disponible). */
    val projetOrigineId: Long? = null,

    @field:NotNull(message = "Le chantier de destination est obligatoire")
    val projetDestinationId: Long?,

    val commentaire: String? = null,
)
