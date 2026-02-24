package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.PartenaireResponse
import com.mikaservices.platform.modules.projet.entity.Partenaire

object PartenaireMapper {

    fun toResponse(entity: Partenaire): PartenaireResponse = PartenaireResponse(
        id = entity.id!!,
        code = entity.code,
        nom = entity.nom,
        type = entity.type,
        pays = entity.pays,
        telephone = entity.telephone,
        email = entity.email,
        adresse = entity.adresse,
        contactPrincipal = entity.contactPrincipal,
        actif = entity.actif,
        createdAt = entity.createdAt
    )
}
