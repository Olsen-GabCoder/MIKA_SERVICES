package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class EnginCreateRequest(
    @field:NotBlank(message = "Le code est obligatoire") @field:Size(max = 50)
    val code: String,
    @field:NotBlank(message = "Le nom est obligatoire") @field:Size(max = 200)
    val nom: String,
    @field:NotNull(message = "Le type est obligatoire")
    val type: TypeEngin,
    val marque: String? = null,
    val modele: String? = null,
    val immatriculation: String? = null,
    val numeroSerie: String? = null,
    val anneeFabrication: Int? = null,
    val dateAcquisition: LocalDate? = null,
    val valeurAcquisition: BigDecimal? = null,
    val proprietaire: String? = null,
    val estLocation: Boolean = false,
    val coutLocationJournalier: BigDecimal? = null
)

data class EnginUpdateRequest(
    val nom: String? = null,
    val type: TypeEngin? = null,
    val marque: String? = null,
    val modele: String? = null,
    val immatriculation: String? = null,
    val numeroSerie: String? = null,
    val anneeFabrication: Int? = null,
    val heuresCompteur: Int? = null,
    val statut: StatutEngin? = null,
    val proprietaire: String? = null,
    val estLocation: Boolean? = null,
    val coutLocationJournalier: BigDecimal? = null
)

data class AffectationEnginRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val enginId: Long,
    @field:NotNull val dateDebut: LocalDate,
    val dateFin: LocalDate? = null,
    val heuresPrevues: Int? = null,
    val statut: StatutAffectation = StatutAffectation.PLANIFIEE,
    val observations: String? = null
)
