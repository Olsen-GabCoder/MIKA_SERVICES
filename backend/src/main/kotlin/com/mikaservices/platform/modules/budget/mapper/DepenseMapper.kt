package com.mikaservices.platform.modules.budget.mapper

import com.mikaservices.platform.modules.budget.dto.response.DepenseResponse
import com.mikaservices.platform.modules.budget.entity.Depense
import com.mikaservices.platform.modules.projet.mapper.ProjetMapper

object DepenseMapper {

    fun toResponse(entity: Depense): DepenseResponse = DepenseResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        projetNom = entity.projet.nom,
        reference = entity.reference,
        libelle = entity.libelle,
        type = entity.type,
        montant = entity.montant,
        dateDepense = entity.dateDepense,
        statut = entity.statut,
        fournisseur = entity.fournisseur,
        numeroFacture = entity.numeroFacture,
        observations = entity.observations,
        validePar = ProjetMapper.toUserSummary(entity.validePar),
        dateValidation = entity.dateValidation,
        createdAt = entity.createdAt
    )
}
