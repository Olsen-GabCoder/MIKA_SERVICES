package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class PointBloquantCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,

    @field:NotBlank(message = "Le titre est obligatoire")
    @field:Size(max = 300)
    val titre: String,

    val description: String? = null,
    val priorite: Priorite = Priorite.NORMALE,
    val detecteParId: Long? = null,
    val assigneAId: Long? = null,
    val dateDetection: LocalDate = LocalDate.now()
)

data class PointBloquantUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val priorite: Priorite? = null,
    val statut: StatutPointBloquant? = null,
    val assigneAId: Long? = null,
    val dateResolution: LocalDate? = null,
    val actionCorrective: String? = null
)
