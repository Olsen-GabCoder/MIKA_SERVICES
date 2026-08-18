package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.TypeOperationMaintenance
import java.time.LocalDate
import java.time.LocalDateTime

data class PlanMaintenanceResponse(
    val id: Long,
    val enginId: Long,
    val enginCode: String,
    val titre: String,
    val description: String?,
    val typeOperation: TypeOperationMaintenance,
    val intervalleJours: Int?,
    val intervalleHeures: Int?,
    val intervalleKm: Int?,
    val seuilAlerte: Int,
    val actif: Boolean,
    val derniereExecution: LocalDate?,
    val dernierCompteur: Int?,
    val prochaineEcheance: LocalDate?,
    val prochainCompteur: Int?,
    /** True si l'échéance date est dépassée. */
    val echeanceDateDepassee: Boolean,
    /** True si l'échéance compteur est dépassée. */
    val echeanceCompteurDepassee: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
