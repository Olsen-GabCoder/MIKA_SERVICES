package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.modules.qualite.dto.response.DemandeReceptionResponse
import com.mikaservices.platform.modules.qualite.entity.DemandeReception

object DemandeReceptionMapper {

    fun toResponse(e: DemandeReception): DemandeReceptionResponse = DemandeReceptionResponse(
        id = e.id!!,
        reference = e.reference,
        titre = e.titre,
        nature = e.nature,
        sousType = e.sousType,
        statut = e.statut,
        description = e.description,
        zoneOuvrage = e.zoneOuvrage,
        dateDemande = e.dateDemande,
        dateDecision = e.dateDecision,
        projetId = e.projet.id!!,
        projetNom = e.projet.nom,
        demandeurId = e.demandeur?.id,
        demandeurNom = e.demandeur?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        decideurId = e.decideur?.id,
        decideurNom = e.decideur?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        observations = e.observations,
        moisReference = e.moisReference,
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )
}
