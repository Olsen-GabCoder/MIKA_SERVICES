package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.PlanMaintenanceResponse
import com.mikaservices.platform.modules.materiel.entity.PlanMaintenance
import java.time.LocalDate

object PlanMaintenanceMapper {

    fun toResponse(entity: PlanMaintenance): PlanMaintenanceResponse {
        val today = LocalDate.now()
        return PlanMaintenanceResponse(
            id = entity.id!!,
            enginId = entity.engin.id!!,
            enginCode = entity.engin.code,
            titre = entity.titre,
            description = entity.description,
            typeOperation = entity.typeOperation,
            intervalleJours = entity.intervalleJours,
            intervalleHeures = entity.intervalleHeures,
            intervalleKm = entity.intervalleKm,
            seuilAlerte = entity.seuilAlerte,
            actif = entity.actif,
            derniereExecution = entity.derniereExecution,
            dernierCompteur = entity.dernierCompteur,
            prochaineEcheance = entity.prochaineEcheance,
            prochainCompteur = entity.prochainCompteur,
            echeanceDateDepassee = entity.prochaineEcheance != null && entity.prochaineEcheance!! < today,
            echeanceCompteurDepassee = entity.prochainCompteur != null && entity.engin.heuresCompteur >= entity.prochainCompteur!!,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
