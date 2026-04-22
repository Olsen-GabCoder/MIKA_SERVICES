package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.TypeDechet
import com.mikaservices.platform.modules.qshe.enums.TypeMesureEnvironnementale
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class SuiviEnvCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val typeMesure: TypeMesureEnvironnementale,
    @field:NotBlank val parametre: String,
    val valeur: BigDecimal? = null, val unite: String? = null,
    val limiteReglementaire: BigDecimal? = null,
    @field:NotNull val dateMesure: LocalDate,
    val localisation: String? = null, val observations: String? = null, val conforme: Boolean? = null
)

data class DechetCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val typeDechet: TypeDechet,
    @field:NotBlank val designation: String,
    val quantite: BigDecimal? = null, val unite: String? = null,
    val filiereElimination: String? = null, val transporteur: String? = null,
    val destination: String? = null, val numeroBsd: String? = null,
    val dateEnlevement: LocalDate? = null, val observations: String? = null
)

data class ProduitChimiqueCreateRequest(
    @field:NotBlank val code: String,
    @field:NotBlank val nomCommercial: String,
    val nomChimique: String? = null, val fournisseur: String? = null,
    val pictogrammesGhs: String? = null, val mentionsDanger: String? = null,
    val epiRequis: String? = null, val conditionsStockage: String? = null,
    val premiersSecours: String? = null, val fdsUrl: String? = null,
    val dateFds: LocalDate? = null, val localisationStockage: String? = null,
    val quantiteStock: String? = null
)

data class ProduitChimiqueUpdateRequest(
    val nomCommercial: String? = null, val nomChimique: String? = null,
    val fournisseur: String? = null, val pictogrammesGhs: String? = null,
    val mentionsDanger: String? = null, val epiRequis: String? = null,
    val conditionsStockage: String? = null, val premiersSecours: String? = null,
    val mesuresIncendie: String? = null, val fdsUrl: String? = null,
    val dateFds: LocalDate? = null, val localisationStockage: String? = null,
    val quantiteStock: String? = null, val actif: Boolean? = null
)
