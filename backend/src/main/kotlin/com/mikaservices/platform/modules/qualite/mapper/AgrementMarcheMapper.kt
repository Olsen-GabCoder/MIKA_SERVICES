package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.modules.qualite.dto.response.AgrementMarcheResponse
import com.mikaservices.platform.modules.qualite.entity.AgrementMarche

object AgrementMarcheMapper {

    fun toResponse(e: AgrementMarche): AgrementMarcheResponse = AgrementMarcheResponse(
        id = e.id!!,
        reference = e.reference,
        objet = e.objet,
        titre = e.titre,
        statut = e.statut,
        description = e.description,
        dateSoumission = e.dateSoumission,
        dateDecision = e.dateDecision,
        projetId = e.projet.id!!,
        projetNom = e.projet.nom,
        decideurId = e.decideur?.id,
        decideurNom = e.decideur?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        observations = e.observations,
        moisReference = e.moisReference,
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )
}
