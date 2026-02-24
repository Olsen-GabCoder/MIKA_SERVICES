package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.request.ClientCreateRequest
import com.mikaservices.platform.modules.projet.dto.response.ClientResponse
import com.mikaservices.platform.modules.projet.entity.Client

object ClientMapper {

    fun toResponse(entity: Client): ClientResponse = ClientResponse(
        id = entity.id!!,
        code = entity.code,
        nom = entity.nom,
        type = entity.type,
        ministere = entity.ministere,
        telephone = entity.telephone,
        email = entity.email,
        adresse = entity.adresse,
        contactPrincipal = entity.contactPrincipal,
        telephoneContact = entity.telephoneContact,
        actif = entity.actif,
        createdAt = entity.createdAt
    )

    fun fromCreateRequest(request: ClientCreateRequest): Client = Client(
        code = request.code,
        nom = request.nom,
        type = request.type,
        ministere = request.ministere,
        telephone = request.telephone,
        email = request.email,
        adresse = request.adresse,
        contactPrincipal = request.contactPrincipal,
        telephoneContact = request.telephoneContact
    )
}
