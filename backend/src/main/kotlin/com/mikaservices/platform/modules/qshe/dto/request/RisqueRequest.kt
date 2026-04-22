package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.CategorieRisque
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class RisqueCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotBlank @field:Size(max = 300) val titre: String,
    val description: String? = null,
    val categorie: CategorieRisque? = null,
    val uniteTravail: String? = null,
    val dangerIdentifie: String? = null,
    @field:Min(1) @field:Max(5) val probabiliteBrute: Int = 3,
    @field:Min(1) @field:Max(5) val graviteBrute: Int = 3,
    val mesuresElimination: String? = null,
    val mesuresSubstitution: String? = null,
    val mesuresIngenierie: String? = null,
    val mesuresAdministratives: String? = null,
    val mesuresEpi: String? = null,
    @field:Min(1) @field:Max(5) val probabiliteResiduelle: Int? = null,
    @field:Min(1) @field:Max(5) val graviteResiduelle: Int? = null,
    val sousProjetId: Long? = null,
    val zoneConcernee: String? = null
)

data class RisqueUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val categorie: CategorieRisque? = null,
    val uniteTravail: String? = null,
    val dangerIdentifie: String? = null,
    @field:Min(1) @field:Max(5) val probabiliteBrute: Int? = null,
    @field:Min(1) @field:Max(5) val graviteBrute: Int? = null,
    val mesuresElimination: String? = null,
    val mesuresSubstitution: String? = null,
    val mesuresIngenierie: String? = null,
    val mesuresAdministratives: String? = null,
    val mesuresEpi: String? = null,
    @field:Min(1) @field:Max(5) val probabiliteResiduelle: Int? = null,
    @field:Min(1) @field:Max(5) val graviteResiduelle: Int? = null,
    val zoneConcernee: String? = null,
    val actif: Boolean? = null
)
