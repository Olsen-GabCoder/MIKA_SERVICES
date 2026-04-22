package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.RisqueResponse
import com.mikaservices.platform.modules.qshe.entity.Risque

object RisqueMapper {
    fun toResponse(e: Risque) = RisqueResponse(
        id = e.id!!, reference = e.reference, titre = e.titre, description = e.description,
        categorie = e.categorie, uniteTravail = e.uniteTravail, dangerIdentifie = e.dangerIdentifie,
        probabiliteBrute = e.probabiliteBrute, graviteBrute = e.graviteBrute, niveauBrut = e.niveauBrut,
        mesuresElimination = e.mesuresElimination, mesuresSubstitution = e.mesuresSubstitution,
        mesuresIngenierie = e.mesuresIngenierie, mesuresAdministratives = e.mesuresAdministratives,
        mesuresEpi = e.mesuresEpi,
        probabiliteResiduelle = e.probabiliteResiduelle, graviteResiduelle = e.graviteResiduelle,
        niveauResiduel = e.niveauResiduel,
        projetId = e.projet.id!!, projetNom = e.projet.nom,
        sousProjetId = e.sousProjet?.id, sousProjetNom = e.sousProjet?.nom,
        zoneConcernee = e.zoneConcernee, actif = e.actif,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )
}
