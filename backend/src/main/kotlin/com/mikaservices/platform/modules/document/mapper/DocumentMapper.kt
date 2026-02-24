package com.mikaservices.platform.modules.document.mapper

import com.mikaservices.platform.modules.document.dto.response.DocumentResponse
import com.mikaservices.platform.modules.document.entity.Document

object DocumentMapper {

    fun toResponse(entity: Document): DocumentResponse {
        return DocumentResponse(
            id = entity.id!!,
            nomOriginal = entity.nomOriginal,
            typeMime = entity.typeMime,
            tailleOctets = entity.tailleOctets,
            typeDocument = entity.typeDocument,
            description = entity.description,
            projetId = entity.projet?.id,
            projetNom = entity.projet?.nom,
            uploadeParNom = entity.uploadePar?.let { "${it.prenom} ${it.nom}" },
            downloadUrl = "/documents/${entity.id}/download",
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
