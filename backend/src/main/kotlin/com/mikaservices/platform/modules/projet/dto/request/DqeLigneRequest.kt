package com.mikaservices.platform.modules.projet.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
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

    val quantite: BigDecimal? = null,
    val prixUnitaire: BigDecimal? = null,
    val montantTotal: BigDecimal? = null,
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

    val quantite: BigDecimal? = null,
    val prixUnitaire: BigDecimal? = null,
    val montantTotal: BigDecimal? = null,
    val avancementPct: BigDecimal? = null,
    val ordre: Int? = null
)
