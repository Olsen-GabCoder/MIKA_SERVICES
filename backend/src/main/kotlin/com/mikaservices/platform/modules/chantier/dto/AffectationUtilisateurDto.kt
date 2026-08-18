package com.mikaservices.platform.modules.chantier.dto

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate
import java.time.LocalDateTime

data class AffectationUtilisateurRequest(
    @field:NotNull
    val userId: Long,
    @field:NotNull
    val projetId: Long,
    @field:NotBlank
    val poste: String,
    @field:NotNull
    val dateDebut: LocalDate,
    val dateFin: LocalDate? = null,
    val statut: StatutAffectation = StatutAffectation.EN_COURS,
    val observations: String? = null
)

/** Modification d'une affectation existante : l'utilisateur et le projet ne changent pas. */
data class AffectationUtilisateurUpdateRequest(
    @field:NotBlank
    val poste: String,
    @field:NotNull
    val dateDebut: LocalDate,
    val dateFin: LocalDate? = null,
    val observations: String? = null
)

data class AffectationUtilisateurResponse(
    val id: Long,
    val user: ProjetUserSummary,
    val projetId: Long,
    val projetNom: String,
    val poste: String,
    val dateDebut: LocalDate,
    val dateFin: LocalDate?,
    val statut: StatutAffectation,
    val observations: String?,
    val createdAt: LocalDateTime?
)
