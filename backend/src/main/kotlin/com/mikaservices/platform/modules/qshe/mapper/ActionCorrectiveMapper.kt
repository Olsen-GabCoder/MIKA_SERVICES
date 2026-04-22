package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.ActionCorrectiveResponse
import com.mikaservices.platform.modules.qshe.entity.ActionCorrective

object ActionCorrectiveMapper {

    fun toResponse(entity: ActionCorrective): ActionCorrectiveResponse {
        val responsable = entity.responsable
        val verificateur = entity.verificateur
        return ActionCorrectiveResponse(
            id = entity.id!!,
            reference = entity.reference,
            titre = entity.titre,
            description = entity.description,
            typeAction = entity.typeAction,
            priorite = entity.priorite,
            statut = entity.statut,
            sourceType = entity.sourceType,
            sourceId = entity.sourceId,
            sourceReference = entity.sourceReference,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            responsableId = responsable?.id,
            responsableNom = responsable?.let { "${it.prenom} ${it.nom}" },
            verificateurId = verificateur?.id,
            verificateurNom = verificateur?.let { "${it.prenom} ${it.nom}" },
            dateEcheance = entity.dateEcheance,
            dateRealisation = entity.dateRealisation,
            dateVerification = entity.dateVerification,
            dateCloture = entity.dateCloture,
            descriptionAction = entity.descriptionAction,
            resultatVerification = entity.resultatVerification,
            efficace = entity.efficace,
            commentaire = entity.commentaire,
            enRetard = entity.enRetard,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
