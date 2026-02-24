package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.TypeMateriau
import com.mikaservices.platform.common.enums.Unite
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class MateriauCreateRequest(
    @field:NotBlank(message = "Le code est obligatoire") @field:Size(max = 50)
    val code: String,
    @field:NotBlank(message = "Le nom est obligatoire") @field:Size(max = 200)
    val nom: String,
    @field:NotNull(message = "Le type est obligatoire")
    val type: TypeMateriau,
    @field:NotNull(message = "L'unité est obligatoire")
    val unite: Unite,
    val description: String? = null,
    val prixUnitaire: BigDecimal? = null,
    val stockActuel: BigDecimal = BigDecimal.ZERO,
    val stockMinimum: BigDecimal = BigDecimal.ZERO,
    val fournisseur: String? = null
)

data class MateriauUpdateRequest(
    val nom: String? = null,
    val type: TypeMateriau? = null,
    val unite: Unite? = null,
    val description: String? = null,
    val prixUnitaire: BigDecimal? = null,
    val stockActuel: BigDecimal? = null,
    val stockMinimum: BigDecimal? = null,
    val fournisseur: String? = null
)

data class AffectationMateriauRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val materiauId: Long,
    @field:NotNull val quantiteAffectee: BigDecimal,
    @field:NotNull val unite: Unite,
    val dateAffectation: LocalDate = LocalDate.now(),
    val observations: String? = null
)
