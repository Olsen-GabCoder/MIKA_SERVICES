package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.IncidentEnginResponse
import com.mikaservices.platform.modules.materiel.entity.IncidentEngin

object IncidentEnginMapper {

    fun toResponse(entity: IncidentEngin): IncidentEnginResponse = IncidentEnginResponse(
        id = entity.id!!,
        enginId = entity.engin.id!!,
        enginCode = entity.engin.code,
        typeIncident = entity.typeIncident,
        gravite = entity.gravite,
        dateIncident = entity.dateIncident,
        description = entity.description,
        lieu = entity.lieu,
        signalePar = entity.signalePar,
        resolu = entity.resolu,
        dateResolution = entity.dateResolution,
        actionsCorrectives = entity.actionsCorrectives,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )
}
