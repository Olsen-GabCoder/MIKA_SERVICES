package com.mikaservices.platform.modules.ia.dto

import java.math.BigDecimal

data class DqeAnalyseResponse(
    val chapitres: List<DqeChapitreExtrait>,
    val avertissements: List<String>,
    val champsExtraits: Int
)

data class DqeChapitreExtrait(
    val numero: String,
    val designation: String,
    val lignes: List<DqeLigneExtraite>
)

data class DqeLigneExtraite(
    val numeroPoste: String?,
    val designation: String,
    val unite: String?,
    val quantite: BigDecimal?,
    val prixUnitaire: BigDecimal?,
    val montantTotal: BigDecimal?
)
