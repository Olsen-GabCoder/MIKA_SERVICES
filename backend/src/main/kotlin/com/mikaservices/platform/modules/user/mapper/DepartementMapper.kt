package com.mikaservices.platform.modules.user.mapper

import com.mikaservices.platform.modules.user.dto.response.DepartementResponse
import com.mikaservices.platform.modules.user.entity.Departement

object DepartementMapper {
    fun toResponse(departement: Departement): DepartementResponse {
        return DepartementResponse(
            id = departement.id!!,
            code = departement.code,
            nom = departement.nom,
            type = departement.type,
            description = departement.description,
            responsable = departement.responsable?.let { UserMapper.toSummaryResponse(it) },
            actif = departement.actif
        )
    }
    
    fun toResponseList(departements: Collection<Departement>): List<DepartementResponse> {
        return departements.map { toResponse(it) }
    }
}
