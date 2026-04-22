package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.PermisTravailResponse
import com.mikaservices.platform.modules.qshe.entity.PermisTravail

object PermisTravailMapper {
    fun toResponse(e: PermisTravail) = PermisTravailResponse(
        id = e.id!!, reference = e.reference, typePermis = e.typePermis,
        descriptionTravaux = e.descriptionTravaux, statut = e.statut,
        zoneTravail = e.zoneTravail, dateDebutValidite = e.dateDebutValidite,
        heureDebut = e.heureDebut, dateFinValidite = e.dateFinValidite, heureFin = e.heureFin,
        mesuresSecurite = e.mesuresSecurite, conditionsParticulieres = e.conditionsParticulieres,
        projetId = e.projet.id!!, projetNom = e.projet.nom,
        demandeurId = e.demandeur?.id, demandeurNom = e.demandeur?.let { "${it.prenom} ${it.nom}" },
        autorisateurId = e.autorisateur?.id, autorisateurNom = e.autorisateur?.let { "${it.prenom} ${it.nom}" },
        dateApprobation = e.dateApprobation, dateCloture = e.dateCloture,
        observationsCloture = e.observationsCloture,
        estExpire = e.estExpire, estActif = e.estActif,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )
}
