package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.IncidentResponse
import com.mikaservices.platform.modules.qshe.dto.response.TemoinResponse
import com.mikaservices.platform.modules.qshe.dto.response.VictimeResponse
import com.mikaservices.platform.modules.qshe.entity.Incident
import com.mikaservices.platform.modules.qshe.entity.TemoinIncident
import com.mikaservices.platform.modules.qshe.entity.VictimeIncident

object IncidentMapper {

    fun toResponse(entity: Incident): IncidentResponse {
        val declarePar = entity.declarePar
        return IncidentResponse(
            id = entity.id!!,
            reference = entity.reference,
            titre = entity.titre,
            description = entity.description,
            typeIncident = entity.typeIncident,
            gravite = entity.gravite,
            statut = entity.statut,
            dateIncident = entity.dateIncident,
            heureIncident = entity.heureIncident,
            lieu = entity.lieu,
            zoneChantier = entity.zoneChantier,
            latitude = entity.latitude,
            longitude = entity.longitude,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            sousProjetId = entity.sousProjet?.id,
            sousProjetNom = entity.sousProjet?.nom,
            declareParId = declarePar?.id,
            declareParNom = declarePar?.let { "${it.prenom} ${it.nom}" },
            descriptionCirconstances = entity.descriptionCirconstances,
            activiteEnCours = entity.activiteEnCours,
            equipementImplique = entity.equipementImplique,
            epiPortes = entity.epiPortes,
            causeImmediate = entity.causeImmediate,
            causeRacine = entity.causeRacine,
            mesuresConservatoires = entity.mesuresConservatoires,
            dateEcheanceCnss = entity.dateEcheanceCnss,
            declarationCnssEffectuee = entity.declarationCnssEffectuee,
            dateDeclarationCnss = entity.dateDeclarationCnss,
            declarationCnssEnRetard = entity.declarationCnssEnRetard,
            dateEcheanceInspectionTravail = entity.dateEcheanceInspectionTravail,
            declarationInspectionEffectuee = entity.declarationInspectionEffectuee,
            dateDeclarationInspection = entity.dateDeclarationInspection,
            declarationInspectionEnRetard = entity.declarationInspectionEnRetard,
            nbVictimes = entity.victimes.size,
            nbTemoins = entity.temoins.size,
            nbPiecesJointes = entity.piecesJointes.size,
            victimes = entity.victimes.map { toVictimeResponse(it) },
            temoins = entity.temoins.map { toTemoinResponse(it) },
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toVictimeResponse(entity: VictimeIncident) = VictimeResponse(
        id = entity.id!!,
        userId = entity.user?.id,
        nom = entity.nom,
        prenom = entity.prenom,
        poste = entity.poste,
        entreprise = entity.entreprise,
        anciennete = entity.anciennete,
        typeContrat = entity.typeContrat,
        natureLesion = entity.natureLesion,
        localisationCorporelle = entity.localisationCorporelle,
        descriptionBlessure = entity.descriptionBlessure,
        arretTravail = entity.arretTravail,
        nbJoursArret = entity.nbJoursArret,
        hospitalisation = entity.hospitalisation,
        declarationCnss = entity.declarationCnss,
        dateDeclarationCnss = entity.dateDeclarationCnss
    )

    fun toTemoinResponse(entity: TemoinIncident) = TemoinResponse(
        id = entity.id!!,
        nom = entity.nom,
        prenom = entity.prenom,
        telephone = entity.telephone,
        email = entity.email,
        entreprise = entity.entreprise,
        temoignage = entity.temoignage
    )
}
