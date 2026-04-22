package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.TypeDechet
import com.mikaservices.platform.modules.qshe.enums.TypeMesureEnvironnementale
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class SuiviEnvResponse(
    val id: Long, val projetId: Long, val projetNom: String,
    val typeMesure: TypeMesureEnvironnementale, val parametre: String,
    val valeur: BigDecimal?, val unite: String?, val limiteReglementaire: BigDecimal?,
    val dateMesure: LocalDate, val localisation: String?, val observations: String?,
    val conforme: Boolean?, val depassement: Boolean,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class DechetResponse(
    val id: Long, val projetId: Long, val projetNom: String,
    val typeDechet: TypeDechet, val designation: String,
    val quantite: BigDecimal?, val unite: String?,
    val filiereElimination: String?, val transporteur: String?, val destination: String?,
    val numeroBsd: String?, val dateEnlevement: LocalDate?, val observations: String?,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class ProduitChimiqueResponse(
    val id: Long, val code: String, val nomCommercial: String, val nomChimique: String?,
    val fournisseur: String?, val pictogrammesGhs: String?, val mentionsDanger: String?,
    val epiRequis: String?, val conditionsStockage: String?, val premiersSecours: String?,
    val mesuresIncendie: String?, val fdsUrl: String?, val dateFds: LocalDate?,
    val localisationStockage: String?, val quantiteStock: String?, val actif: Boolean,
    val fdsObsolete: Boolean,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class EnvironnementSummaryResponse(
    val totalMesures: Long, val totalDechets: Long, val depassements: Long
)
