package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.ResultatItem
import com.mikaservices.platform.modules.qshe.enums.StatutInspection
import com.mikaservices.platform.modules.qshe.enums.TypeInspection
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class InspectionCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotBlank @field:Size(max = 300) val titre: String,
    val description: String? = null,
    @field:NotNull val typeInspection: TypeInspection,
    val inspecteurId: Long? = null,
    val datePlanifiee: LocalDate? = null,
    val zoneInspecte: String? = null,
    val sousProjetId: Long? = null,
    val checklistTemplateId: Long? = null
)

data class InspectionUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val statut: StatutInspection? = null,
    val inspecteurId: Long? = null,
    val datePlanifiee: LocalDate? = null,
    val dateRealisation: LocalDate? = null,
    val zoneInspecte: String? = null,
    val observations: String? = null,
    val items: List<InspectionItemUpdateRequest>? = null
)

data class InspectionItemUpdateRequest(
    val id: Long? = null,
    val resultat: ResultatItem,
    val commentaire: String? = null,
    val photoUrl: String? = null
)

data class ChecklistTemplateCreateRequest(
    @field:NotBlank @field:Size(max = 50) val code: String,
    @field:NotBlank @field:Size(max = 300) val nom: String,
    val description: String? = null,
    val typeInspection: TypeInspection? = null,
    val items: List<ChecklistTemplateItemRequest> = emptyList()
)

data class ChecklistTemplateItemRequest(
    val ordre: Int,
    @field:NotBlank val libelle: String,
    val section: String? = null,
    val description: String? = null,
    val critique: Boolean = false,
    val poids: Int = 1
)
