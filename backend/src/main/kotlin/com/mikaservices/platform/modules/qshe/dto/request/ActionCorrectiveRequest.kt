package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.PrioriteAction
import com.mikaservices.platform.modules.qshe.enums.SourceAction
import com.mikaservices.platform.modules.qshe.enums.StatutAction
import com.mikaservices.platform.modules.qshe.enums.TypeAction
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class ActionCorrectiveCreateRequest(
    @field:NotNull(message = "Le projet est obligatoire")
    val projetId: Long,

    @field:NotBlank(message = "Le titre est obligatoire")
    @field:Size(max = 300)
    val titre: String,

    val description: String? = null,

    @field:NotNull(message = "Le type d'action est obligatoire")
    val typeAction: TypeAction,

    val priorite: PrioriteAction = PrioriteAction.NORMALE,

    @field:NotNull(message = "Le type de source est obligatoire")
    val sourceType: SourceAction,

    @field:NotNull(message = "L'identifiant de la source est obligatoire")
    val sourceId: Long,

    val sourceReference: String? = null,

    val responsableId: Long? = null,
    val dateEcheance: LocalDate? = null,
    val descriptionAction: String? = null
)

data class ActionCorrectiveUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val typeAction: TypeAction? = null,
    val priorite: PrioriteAction? = null,
    val statut: StatutAction? = null,
    val responsableId: Long? = null,
    val verificateurId: Long? = null,
    val dateEcheance: LocalDate? = null,
    val dateRealisation: LocalDate? = null,
    val dateVerification: LocalDate? = null,
    val descriptionAction: String? = null,
    val resultatVerification: String? = null,
    val efficace: Boolean? = null,
    val commentaire: String? = null
)
