package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.common.enums.StatutNonConformite
import com.mikaservices.platform.modules.projet.mapper.ProjetMapper
import com.mikaservices.platform.modules.qualite.dto.response.ControleQualiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.NonConformiteResponse
import com.mikaservices.platform.modules.qualite.entity.ControleQualite
import com.mikaservices.platform.modules.qualite.entity.NonConformite
import java.time.LocalDate

object QualiteMapper {

    fun toControleResponse(entity: ControleQualite): ControleQualiteResponse {
        return ControleQualiteResponse(
            id = entity.id!!,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            reference = entity.reference,
            titre = entity.titre,
            description = entity.description,
            typeControle = entity.typeControle,
            statut = entity.statut,
            inspecteur = ProjetMapper.toUserSummary(entity.inspecteur),
            datePlanifiee = entity.datePlanifiee,
            dateRealisation = entity.dateRealisation,
            zoneControlee = entity.zoneControlee,
            criteresVerification = entity.criteresVerification,
            observations = entity.observations,
            noteGlobale = entity.noteGlobale,
            nbNonConformites = entity.nonConformites.size,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toNonConformiteResponse(entity: NonConformite): NonConformiteResponse {
        val enRetard = entity.dateEcheanceCorrection != null &&
                entity.dateEcheanceCorrection!!.isBefore(LocalDate.now()) &&
                entity.statut != StatutNonConformite.CLOTUREE

        return NonConformiteResponse(
            id = entity.id!!,
            controleQualiteId = entity.controleQualite.id!!,
            controleReference = entity.controleQualite.reference,
            reference = entity.reference,
            titre = entity.titre,
            description = entity.description,
            gravite = entity.gravite,
            statut = entity.statut,
            responsableTraitement = ProjetMapper.toUserSummary(entity.responsableTraitement),
            causeIdentifiee = entity.causeIdentifiee,
            actionCorrective = entity.actionCorrective,
            dateDetection = entity.dateDetection,
            dateEcheanceCorrection = entity.dateEcheanceCorrection,
            dateCloture = entity.dateCloture,
            preuveCorrection = entity.preuveCorrection,
            enRetard = enRetard,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
