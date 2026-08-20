package com.mikaservices.platform.modules.materiel.dto.response

import java.time.LocalDate

/** Chantier sur lequel l'utilisateur a une affectation EN_COURS. */
data class TerrainMeChantierResponse(
    val id: Long,
    val nom: String,
    val poste: String,
    val depuis: LocalDate
)

/** Chantier sélectionnable dans les formulaires terrain (périmètre : affectations, trio = tout). */
data class TerrainChantierResponse(val id: Long, val nom: String)

/** Contexte de l'utilisateur connecté pour l'app mobile terrain. */
data class TerrainMeResponse(
    val id: Long,
    val nom: String,
    val prenom: String,
    val email: String,
    val roles: List<String>,
    val permissions: List<String>,
    val chantiers: List<TerrainMeChantierResponse>
)
