package com.mikaservices.platform.modules.planning.dto.request

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.common.enums.TypePrevision
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
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
    val statut: StatutTache = StatutTache.A_FAIRE,
    val priorite: Priorite = Priorite.NORMALE,
    val assigneAId: Long? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val dateEcheance: LocalDate? = null,
    val tacheParentId: Long? = null,
    val semaine: Int? = null,
    val annee: Int? = null,
    val typePrevision: TypePrevision? = null,
    @field:Min(value = 0, message = "L'avancement doit être entre 0 et 100")
    @field:Max(value = 100, message = "L'avancement doit être entre 0 et 100")
    val pourcentageAvancement: Int? = null
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
    @field:Min(value = 0, message = "L'avancement doit être entre 0 et 100")
    @field:Max(value = 100, message = "L'avancement doit être entre 0 et 100")
    val pourcentageAvancement: Int? = null,
    val semaine: Int? = null,
    val annee: Int? = null,
    val typePrevision: TypePrevision? = null,
    val tacheParentId: Long? = null
)
