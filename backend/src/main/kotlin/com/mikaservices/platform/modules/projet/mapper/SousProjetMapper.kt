package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.SousProjetResponse
import com.mikaservices.platform.modules.projet.entity.SousProjet

object SousProjetMapper {

    fun toResponse(entity: SousProjet): SousProjetResponse = SousProjetResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        projetNom = entity.projet.nom,
        code = entity.code,
        nom = entity.nom,
        description = entity.description,
        typeTravaux = entity.typeTravaux,
        statut = entity.statut,
        montantHT = entity.montantHT,
        montantTTC = entity.montantTTC,
        delaiMois = entity.delaiMois,
        dateDebut = entity.dateDebut,
        dateFin = entity.dateFin,
        avancementPhysique = entity.avancementPhysique,
        responsable = ProjetMapper.toUserSummary(entity.responsable),
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )
}
