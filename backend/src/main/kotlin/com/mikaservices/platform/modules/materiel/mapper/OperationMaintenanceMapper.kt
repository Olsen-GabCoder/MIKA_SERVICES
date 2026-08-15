package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.OperationMaintenanceResponse
import com.mikaservices.platform.modules.materiel.entity.OperationMaintenance

object OperationMaintenanceMapper {

    fun toResponse(entity: OperationMaintenance): OperationMaintenanceResponse = OperationMaintenanceResponse(
        id = entity.id!!,
        enginId = entity.engin.id!!,
        enginCode = entity.engin.code,
        typeOperation = entity.typeOperation,
        statut = entity.statut,
        description = entity.description,
        echeanceDate = entity.echeanceDate,
        echeanceHeures = entity.echeanceHeures,
        coutEstime = entity.coutEstime,
        coutReel = entity.coutReel,
        executePar = entity.executePar,
        dateRealisation = entity.dateRealisation,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )
}
