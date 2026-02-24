package com.mikaservices.platform.modules.user.mapper

import com.mikaservices.platform.modules.user.dto.response.SpecialiteResponse
import com.mikaservices.platform.modules.user.entity.Specialite

object SpecialiteMapper {
    fun toResponse(specialite: Specialite): SpecialiteResponse {
        return SpecialiteResponse(
            id = specialite.id!!,
            code = specialite.code,
            nom = specialite.nom,
            categorie = specialite.categorie,
            description = specialite.description,
            actif = specialite.actif
        )
    }
    
    fun toResponseList(specialites: Collection<Specialite>): List<SpecialiteResponse> {
        return specialites.map { toResponse(it) }
    }
}
