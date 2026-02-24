package com.mikaservices.platform.modules.materiel.mapper

import com.mikaservices.platform.modules.materiel.dto.response.AffectationEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginSummaryResponse
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import com.mikaservices.platform.modules.materiel.entity.Engin

object EnginMapper {

    fun toResponse(entity: Engin): EnginResponse = EnginResponse(
        id = entity.id!!, code = entity.code, nom = entity.nom, type = entity.type,
        marque = entity.marque, modele = entity.modele, immatriculation = entity.immatriculation,
        numeroSerie = entity.numeroSerie, anneeFabrication = entity.anneeFabrication,
        dateAcquisition = entity.dateAcquisition, valeurAcquisition = entity.valeurAcquisition,
        heuresCompteur = entity.heuresCompteur, statut = entity.statut,
        proprietaire = entity.proprietaire, estLocation = entity.estLocation,
        coutLocationJournalier = entity.coutLocationJournalier,
        actif = entity.actif, createdAt = entity.createdAt, updatedAt = entity.updatedAt
    )

    fun toSummaryResponse(entity: Engin): EnginSummaryResponse = EnginSummaryResponse(
        id = entity.id!!, code = entity.code, nom = entity.nom, type = entity.type,
        marque = entity.marque, immatriculation = entity.immatriculation,
        statut = entity.statut, estLocation = entity.estLocation
    )

    fun toAffectationResponse(entity: AffectationEnginChantier): AffectationEnginResponse = AffectationEnginResponse(
        id = entity.id!!, projetId = entity.projet.id!!, projetNom = entity.projet.nom,
        enginId = entity.engin.id!!, enginNom = entity.engin.nom, enginCode = entity.engin.code,
        dateDebut = entity.dateDebut, dateFin = entity.dateFin,
        heuresPrevues = entity.heuresPrevues, heuresReelles = entity.heuresReelles,
        statut = entity.statut, observations = entity.observations, createdAt = entity.createdAt
    )
}
