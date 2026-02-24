package com.mikaservices.platform.modules.chantier.mapper

import com.mikaservices.platform.modules.chantier.dto.response.AffectationChantierResponse
import com.mikaservices.platform.modules.chantier.dto.response.EquipeResponse
import com.mikaservices.platform.modules.chantier.dto.response.MembreEquipeResponse
import com.mikaservices.platform.modules.chantier.entity.AffectationChantier
import com.mikaservices.platform.modules.chantier.entity.Equipe
import com.mikaservices.platform.modules.chantier.entity.MembreEquipe
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import com.mikaservices.platform.modules.projet.mapper.ProjetMapper

object EquipeMapper {

    fun toResponse(entity: Equipe): EquipeResponse = EquipeResponse(
        id = entity.id!!,
        code = entity.code,
        nom = entity.nom,
        type = entity.type,
        chefEquipe = ProjetMapper.toUserSummary(entity.chefEquipe),
        effectif = entity.effectif,
        actif = entity.actif,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )

    fun toMembreResponse(entity: MembreEquipe): MembreEquipeResponse = MembreEquipeResponse(
        id = entity.id!!,
        equipeId = entity.equipe.id!!,
        user = ProjetUserSummary(
            id = entity.user.id!!,
            nom = entity.user.nom,
            prenom = entity.user.prenom,
            email = entity.user.email
        ),
        role = entity.role,
        dateAffectation = entity.dateAffectation,
        dateFin = entity.dateFin,
        actif = entity.actif
    )

    fun toAffectationResponse(entity: AffectationChantier): AffectationChantierResponse = AffectationChantierResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        projetNom = entity.projet.nom,
        equipeId = entity.equipe.id!!,
        equipeNom = entity.equipe.nom,
        dateDebut = entity.dateDebut,
        dateFin = entity.dateFin,
        statut = entity.statut,
        observations = entity.observations,
        createdAt = entity.createdAt
    )
}
