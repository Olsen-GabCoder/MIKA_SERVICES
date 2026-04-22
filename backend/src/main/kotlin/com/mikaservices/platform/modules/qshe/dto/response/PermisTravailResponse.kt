package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.StatutPermis
import com.mikaservices.platform.modules.qshe.enums.TypePermis
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class PermisTravailResponse(
    val id: Long, val reference: String, val typePermis: TypePermis,
    val descriptionTravaux: String, val statut: StatutPermis,
    val zoneTravail: String?, val dateDebutValidite: LocalDate?,
    val heureDebut: LocalTime?, val dateFinValidite: LocalDate?, val heureFin: LocalTime?,
    val mesuresSecurite: String?, val conditionsParticulieres: String?,
    val projetId: Long, val projetNom: String,
    val demandeurId: Long?, val demandeurNom: String?,
    val autorisateurId: Long?, val autorisateurNom: String?,
    val dateApprobation: LocalDateTime?, val dateCloture: LocalDateTime?,
    val observationsCloture: String?,
    val estExpire: Boolean, val estActif: Boolean,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class PermisTravailSummaryResponse(
    val totalPermis: Long, val actifs: Long, val expires: Long
)
