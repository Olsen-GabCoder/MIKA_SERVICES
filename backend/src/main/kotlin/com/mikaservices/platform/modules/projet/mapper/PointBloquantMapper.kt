package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.PointBloquantResponse
import com.mikaservices.platform.modules.projet.entity.PointBloquant

object PointBloquantMapper {

    fun toResponse(entity: PointBloquant): PointBloquantResponse = PointBloquantResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        projetNom = entity.projet.nom,
        titre = entity.titre,
        description = entity.description,
        priorite = entity.priorite,
        statut = entity.statut,
        detectePar = ProjetMapper.toUserSummary(entity.detectePar),
        assigneA = ProjetMapper.toUserSummary(entity.assigneA),
        dateDetection = entity.dateDetection,
        dateResolution = entity.dateResolution,
        actionCorrective = entity.actionCorrective,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )
}
