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
        dateAcquisition = entity.dateAcquisition, dateMiseEnService = entity.dateMiseEnService,
        valeurAcquisition = entity.valeurAcquisition,
        heuresCompteur = entity.heuresCompteur, statut = entity.statut,
        etat = entity.etat, modeAcquisition = entity.modeAcquisition,
        proprietaire = entity.proprietaire, estLocation = entity.estLocation,
        coutLocationJournalier = entity.coutLocationJournalier,
        carburant = entity.carburant, puissance = entity.puissance,
        poids = entity.poids, capacite = entity.capacite,
        caracteristiques = entity.caracteristiques,
        photo = entity.photo, qrCodeToken = entity.qrCodeToken,
        latitude = entity.latitude, longitude = entity.longitude,
        notes = entity.notes,
        actif = entity.actif, createdAt = entity.createdAt, updatedAt = entity.updatedAt
    )

    fun toSummaryResponse(entity: Engin, chantierActuel: String? = null): EnginSummaryResponse = EnginSummaryResponse(
        id = entity.id!!, code = entity.code, nom = entity.nom, type = entity.type,
        marque = entity.marque, immatriculation = entity.immatriculation,
        statut = entity.statut, etat = entity.etat, estLocation = entity.estLocation,
        photo = entity.photo, chantierActuel = chantierActuel,
        heuresCompteur = entity.heuresCompteur
    )

    fun toAffectationResponse(entity: AffectationEnginChantier): AffectationEnginResponse = AffectationEnginResponse(
        id = entity.id!!, projetId = entity.projet.id!!, projetNom = entity.projet.nom,
        enginId = entity.engin.id!!, enginNom = entity.engin.nom, enginCode = entity.engin.code,
        dateDebut = entity.dateDebut, dateFin = entity.dateFin,
        heuresPrevues = entity.heuresPrevues, heuresReelles = entity.heuresReelles,
        statut = entity.statut, observations = entity.observations, createdAt = entity.createdAt
    )
}
