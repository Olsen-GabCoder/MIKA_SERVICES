package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.EtatEpi
import com.mikaservices.platform.modules.qshe.enums.TypeEpi
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class EpiCreateRequest(
    @field:NotBlank @field:Size(max = 50) val code: String,
    @field:NotNull val typeEpi: TypeEpi,
    @field:NotBlank @field:Size(max = 300) val designation: String,
    val marque: String? = null, val modele: String? = null, val taille: String? = null,
    val normeReference: String? = null, val dateAchat: LocalDate? = null,
    val dateExpiration: LocalDate? = null, val prixUnitaire: BigDecimal? = null,
    val affecteAId: Long? = null, val quantiteStock: Int = 0, val stockMinimum: Int = 0,
    val observations: String? = null
)

data class EpiUpdateRequest(
    val designation: String? = null, val typeEpi: TypeEpi? = null,
    val marque: String? = null, val modele: String? = null, val taille: String? = null,
    val normeReference: String? = null, val etat: EtatEpi? = null,
    val datePremiereUtilisation: LocalDate? = null, val dateExpiration: LocalDate? = null,
    val dateProchaineInspection: LocalDate? = null, val prixUnitaire: BigDecimal? = null,
    val affecteAId: Long? = null, val dateAffectation: LocalDate? = null,
    val quantiteStock: Int? = null, val stockMinimum: Int? = null,
    val observations: String? = null
)
