package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.EpiResponse
import com.mikaservices.platform.modules.qshe.entity.Epi

object EpiMapper {
    fun toResponse(e: Epi) = EpiResponse(
        id = e.id!!, code = e.code, typeEpi = e.typeEpi, designation = e.designation,
        marque = e.marque, modele = e.modele, taille = e.taille, normeReference = e.normeReference,
        etat = e.etat, dateAchat = e.dateAchat, datePremiereUtilisation = e.datePremiereUtilisation,
        dateExpiration = e.dateExpiration, dateProchaineInspection = e.dateProchaineInspection,
        prixUnitaire = e.prixUnitaire,
        affecteAId = e.affecteA?.id, affecteANom = e.affecteA?.let { "${it.prenom} ${it.nom}" },
        dateAffectation = e.dateAffectation, quantiteStock = e.quantiteStock, stockMinimum = e.stockMinimum,
        observations = e.observations, expire = e.expire,
        joursAvantExpiration = e.joursAvantExpiration, stockBas = e.stockBas,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )
}
