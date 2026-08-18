package com.mikaservices.platform.modules.projet.dto.request

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.PositiveOrZero
import jakarta.validation.constraints.Size
import java.math.BigDecimal

data class DqeLigneCreateRequest(
    @field:NotNull(message = "L'ID du chapitre est obligatoire")
    val chapitreId: Long,

    @field:Size(max = 30)
    val numeroPoste: String? = null,

    @field:NotBlank(message = "La désignation est obligatoire")
    @field:Size(max = 500)
    val designation: String,

    @field:Size(max = 30)
    val unite: String? = null,

    @field:PositiveOrZero(message = "La quantité ne peut pas être négative")
    val quantite: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le prix unitaire ne peut pas être négatif")
    val prixUnitaire: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le montant total ne peut pas être négatif")
    val montantTotal: BigDecimal? = null,
    @field:DecimalMin(value = "0", message = "L'avancement doit être entre 0 et 100")
    @field:DecimalMax(value = "100", message = "L'avancement doit être entre 0 et 100")
    val avancementPct: BigDecimal? = null,
    val ordre: Int? = null
)

data class DqeLigneUpdateRequest(
    @field:Size(max = 30)
    val numeroPoste: String? = null,

    @field:Size(max = 500)
    val designation: String? = null,

    @field:Size(max = 30)
    val unite: String? = null,

    @field:PositiveOrZero(message = "La quantité ne peut pas être négative")
    val quantite: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le prix unitaire ne peut pas être négatif")
    val prixUnitaire: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le montant total ne peut pas être négatif")
    val montantTotal: BigDecimal? = null,
    @field:DecimalMin(value = "0", message = "L'avancement doit être entre 0 et 100")
    @field:DecimalMax(value = "100", message = "L'avancement doit être entre 0 et 100")
    val avancementPct: BigDecimal? = null,
    val ordre: Int? = null
)
