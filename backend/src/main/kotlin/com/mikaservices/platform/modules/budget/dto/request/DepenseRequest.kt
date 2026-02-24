package com.mikaservices.platform.modules.budget.dto.request

import com.mikaservices.platform.common.enums.StatutDepense
import com.mikaservices.platform.common.enums.TypeDepense
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class DepenseCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,
    @field:NotBlank(message = "La référence est obligatoire") @field:Size(max = 50)
    val reference: String,
    @field:NotBlank(message = "Le libellé est obligatoire") @field:Size(max = 300)
    val libelle: String,
    @field:NotNull(message = "Le type est obligatoire")
    val type: TypeDepense,
    @field:NotNull(message = "Le montant est obligatoire")
    val montant: BigDecimal,
    @field:NotNull(message = "La date est obligatoire")
    val dateDepense: LocalDate,
    val fournisseur: String? = null,
    val numeroFacture: String? = null,
    val observations: String? = null
)

data class DepenseUpdateRequest(
    val libelle: String? = null,
    val type: TypeDepense? = null,
    val montant: BigDecimal? = null,
    val dateDepense: LocalDate? = null,
    val statut: StatutDepense? = null,
    val fournisseur: String? = null,
    val numeroFacture: String? = null,
    val observations: String? = null,
    val valideParId: Long? = null
)
