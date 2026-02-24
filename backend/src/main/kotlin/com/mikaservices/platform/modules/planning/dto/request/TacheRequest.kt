package com.mikaservices.platform.modules.planning.dto.request

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class TacheCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,
    @field:NotBlank(message = "Le titre est obligatoire") @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    val priorite: Priorite = Priorite.NORMALE,
    val assigneAId: Long? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val dateEcheance: LocalDate? = null,
    val tacheParentId: Long? = null
)

data class TacheUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val statut: StatutTache? = null,
    val priorite: Priorite? = null,
    val assigneAId: Long? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val dateEcheance: LocalDate? = null,
    val pourcentageAvancement: Int? = null
)
