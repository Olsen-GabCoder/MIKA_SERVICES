package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.entity.MouvementEngin
import com.mikaservices.platform.modules.user.entity.User

object MouvementEnginMapper {

    fun toResponse(entity: MouvementEngin): MouvementEnginResponse {
        val initiator: User = entity.initiateur
        val initiatorLabel = "${initiator.prenom} ${initiator.nom}".trim()
        return MouvementEnginResponse(
            id = entity.id!!,
            enginId = entity.engin.id!!,
            enginCode = entity.engin.code,
            enginNom = entity.engin.nom,
            projetOrigineId = entity.projetOrigine?.id,
            projetOrigineNom = entity.projetOrigine?.nom,
            projetDestinationId = entity.projetDestination.id!!,
            projetDestinationNom = entity.projetDestination.nom,
            initiateurUserId = initiator.id!!,
            initiateurNom = initiatorLabel,
            statut = entity.statut,
            dateDemande = entity.dateDemande,
            dateDepartConfirmee = entity.dateDepartConfirmee,
            dateReceptionConfirmee = entity.dateReceptionConfirmee,
            commentaire = entity.commentaire,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt,
        )
    }
}
