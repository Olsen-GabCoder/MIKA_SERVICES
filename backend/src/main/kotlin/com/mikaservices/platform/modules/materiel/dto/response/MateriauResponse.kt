package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.TypeMateriau
import com.mikaservices.platform.common.enums.Unite
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class MateriauResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeMateriau,
    val unite: Unite,
    val description: String?,
    val prixUnitaire: BigDecimal?,
    val stockActuel: BigDecimal,
    val stockMinimum: BigDecimal,
    val stockBas: Boolean,
    val fournisseur: String?,
    val actif: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class MateriauSummaryResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeMateriau,
    val unite: Unite,
    val stockActuel: BigDecimal,
    val stockMinimum: BigDecimal,
    val stockBas: Boolean,
    val fournisseur: String?
)

data class AffectationMateriauResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val materiauId: Long,
    val materiauNom: String,
    val materiauCode: String,
    val quantiteAffectee: BigDecimal,
    val unite: Unite,
    val dateAffectation: LocalDate,
    val observations: String?,
    val createdAt: LocalDateTime?
)
