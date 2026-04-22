package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.EtatEpi
import com.mikaservices.platform.modules.qshe.enums.TypeEpi
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class EpiResponse(
    val id: Long, val code: String, val typeEpi: TypeEpi, val designation: String,
    val marque: String?, val modele: String?, val taille: String?, val normeReference: String?,
    val etat: EtatEpi, val dateAchat: LocalDate?, val datePremiereUtilisation: LocalDate?,
    val dateExpiration: LocalDate?, val dateProchaineInspection: LocalDate?,
    val prixUnitaire: BigDecimal?, val affecteAId: Long?, val affecteANom: String?,
    val dateAffectation: LocalDate?, val quantiteStock: Int, val stockMinimum: Int,
    val observations: String?, val expire: Boolean, val joursAvantExpiration: Long?, val stockBas: Boolean,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class EpiSummaryResponse(
    val totalEpi: Long, val enService: Long, val expires: Long, val stocksBas: Long
)
