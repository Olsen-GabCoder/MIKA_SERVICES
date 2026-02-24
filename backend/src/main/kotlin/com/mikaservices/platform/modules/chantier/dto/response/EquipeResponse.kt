package com.mikaservices.platform.modules.chantier.dto.response

import com.mikaservices.platform.common.enums.RoleDansEquipe
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.TypeEquipe
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import java.time.LocalDate
import java.time.LocalDateTime

data class EquipeResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeEquipe,
    val chefEquipe: ProjetUserSummary?,
    val effectif: Int,
    val actif: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class MembreEquipeResponse(
    val id: Long,
    val equipeId: Long,
    val user: ProjetUserSummary,
    val role: RoleDansEquipe,
    val dateAffectation: LocalDate,
    val dateFin: LocalDate?,
    val actif: Boolean
)

data class AffectationChantierResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val equipeId: Long,
    val equipeNom: String,
    val dateDebut: LocalDate,
    val dateFin: LocalDate?,
    val statut: StatutAffectation,
    val observations: String?,
    val createdAt: LocalDateTime?
)
