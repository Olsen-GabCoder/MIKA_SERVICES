package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.PrevisionResponse
import com.mikaservices.platform.modules.projet.entity.Prevision

object PrevisionMapper {

    fun toResponse(entity: Prevision): PrevisionResponse = PrevisionResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        projetNom = entity.projet.nom ?: "",
        semaine = entity.semaine,
        annee = entity.annee,
        description = entity.description,
        type = entity.type,
        dateDebut = entity.dateDebut,
        dateFin = entity.dateFin,
        statut = entity.statut,
        createdAt = entity.createdAt
    )
}
