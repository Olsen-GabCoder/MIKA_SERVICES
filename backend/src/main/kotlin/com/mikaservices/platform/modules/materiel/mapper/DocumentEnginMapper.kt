package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.DocumentEnginResponse
import com.mikaservices.platform.modules.materiel.entity.DocumentEngin

object DocumentEnginMapper {

    fun toResponse(entity: DocumentEngin): DocumentEnginResponse = DocumentEnginResponse(
        id = entity.id!!,
        enginId = entity.engin.id!!,
        enginCode = entity.engin.code,
        typeDocument = entity.typeDocument,
        nom = entity.nom,
        urlFichier = entity.urlFichier,
        dateExpiration = entity.dateExpiration,
        commentaire = entity.commentaire,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )
}
