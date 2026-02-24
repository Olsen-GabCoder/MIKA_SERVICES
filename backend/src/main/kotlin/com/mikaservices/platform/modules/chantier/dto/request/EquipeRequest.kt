package com.mikaservices.platform.modules.chantier.dto.request

import com.mikaservices.platform.common.enums.RoleDansEquipe
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.TypeEquipe
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class EquipeCreateRequest(
    @field:NotBlank(message = "Le code est obligatoire") @field:Size(max = 50)
    val code: String,
    @field:NotBlank(message = "Le nom est obligatoire") @field:Size(max = 200)
    val nom: String,
    @field:NotNull(message = "Le type est obligatoire")
    val type: TypeEquipe,
    val chefEquipeId: Long? = null,
    val effectif: Int = 0
)

data class EquipeUpdateRequest(
    val nom: String? = null,
    val type: TypeEquipe? = null,
    val chefEquipeId: Long? = null,
    val effectif: Int? = null
)

data class MembreEquipeRequest(
    @field:NotNull val equipeId: Long,
    @field:NotNull val userId: Long,
    @field:NotNull val role: RoleDansEquipe,
    val dateAffectation: LocalDate = LocalDate.now()
)

data class AffectationChantierRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val equipeId: Long,
    @field:NotNull val dateDebut: LocalDate,
    val dateFin: LocalDate? = null,
    val statut: StatutAffectation = StatutAffectation.PLANIFIEE,
    val observations: String? = null
)
