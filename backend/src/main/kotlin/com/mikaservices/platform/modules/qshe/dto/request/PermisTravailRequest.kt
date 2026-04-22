package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.StatutPermis
import com.mikaservices.platform.modules.qshe.enums.TypePermis
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate
import java.time.LocalTime

data class PermisTravailCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val typePermis: TypePermis,
    @field:NotBlank val descriptionTravaux: String,
    val zoneTravail: String? = null,
    val dateDebutValidite: LocalDate? = null,
    val heureDebut: LocalTime? = null,
    val dateFinValidite: LocalDate? = null,
    val heureFin: LocalTime? = null,
    val mesuresSecurite: String? = null,
    val conditionsParticulieres: String? = null,
    val demandeurId: Long? = null
)

data class PermisTravailUpdateRequest(
    val typePermis: TypePermis? = null,
    val descriptionTravaux: String? = null,
    val statut: StatutPermis? = null,
    val zoneTravail: String? = null,
    val dateDebutValidite: LocalDate? = null,
    val heureDebut: LocalTime? = null,
    val dateFinValidite: LocalDate? = null,
    val heureFin: LocalTime? = null,
    val mesuresSecurite: String? = null,
    val conditionsParticulieres: String? = null,
    val autorisateurId: Long? = null,
    val observationsCloture: String? = null
)
