package com.mikaservices.platform.modules.bareme.dto.request

import com.mikaservices.platform.common.enums.TypeLigneBareme
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal

data class BaremeArticleCreateRequest(
    @field:NotNull
    val corpsEtatId: Long?,

    @field:NotNull
    val type: TypeLigneBareme?,

    @field:Size(max = 50)
    val reference: String? = null,

    @field:NotBlank
    @field:Size(max = 2000)
    val libelle: String?,

    @field:Size(max = 20)
    val unite: String? = null,

    @field:Size(max = 120)
    val famille: String? = null,

    @field:Size(max = 120)
    val categorie: String? = null,

    // Materiau
    val fournisseurId: Long? = null,
    @field:Size(max = 200)
    val fournisseurNom: String? = null,
    @field:Size(max = 100)
    val fournisseurContact: String? = null,
    val prixTtc: BigDecimal? = null,
    @field:Size(max = 50)
    val datePrix: String? = null,
    @field:Size(max = 50)
    val refReception: String? = null,
    @field:Size(max = 30)
    val codeFournisseur: String? = null,
    val prixEstime: Boolean = false,

    // Prestation
    val debourse: BigDecimal? = null,
    val prixVente: BigDecimal? = null,
    val coefficientPv: BigDecimal? = null,
    @field:Size(max = 20)
    val unitePrestation: String? = null,
    val totauxEstimes: Boolean = false,
    @field:Valid
    val lignesPrestation: List<BaremePrestationLigneCreateRequest> = emptyList()
)

data class BaremePrestationLigneCreateRequest(
    @field:NotBlank
    @field:Size(max = 2000)
    val libelle: String?,
    val quantite: BigDecimal? = null,
    val prixUnitaire: BigDecimal? = null,
    @field:Size(max = 20)
    val unite: String? = null,
    val somme: BigDecimal? = null,
    val prixEstime: Boolean = false
)
