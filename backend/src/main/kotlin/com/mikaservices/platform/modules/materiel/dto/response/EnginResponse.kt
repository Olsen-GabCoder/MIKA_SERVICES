package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class EnginResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeEngin,
    val marque: String?,
    val modele: String?,
    val immatriculation: String?,
    val numeroSerie: String?,
    val anneeFabrication: Int?,
    val dateAcquisition: LocalDate?,
    val valeurAcquisition: BigDecimal?,
    val heuresCompteur: Int,
    val statut: StatutEngin,
    val proprietaire: String?,
    val estLocation: Boolean,
    val coutLocationJournalier: BigDecimal?,
    val actif: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class EnginSummaryResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeEngin,
    val marque: String?,
    val immatriculation: String?,
    val statut: StatutEngin,
    val estLocation: Boolean
)

data class AffectationEnginResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val enginId: Long,
    val enginNom: String,
    val enginCode: String,
    val dateDebut: LocalDate,
    val dateFin: LocalDate?,
    val heuresPrevues: Int?,
    val heuresReelles: Int,
    val statut: StatutAffectation,
    val observations: String?,
    val createdAt: LocalDateTime?
)
