package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.*
import com.mikaservices.platform.modules.qshe.entity.*
import com.mikaservices.platform.modules.qshe.enums.ResultatItem

object InspectionMapper {

    fun toResponse(e: Inspection): InspectionResponse {
        val insp = e.inspecteur
        return InspectionResponse(
            id = e.id!!,
            reference = e.reference,
            titre = e.titre,
            description = e.description,
            typeInspection = e.typeInspection,
            statut = e.statut,
            projetId = e.projet.id!!,
            projetNom = e.projet.nom,
            sousProjetId = e.sousProjet?.id,
            sousProjetNom = e.sousProjet?.nom,
            inspecteurId = insp?.id,
            inspecteurNom = insp?.let { "${it.prenom} ${it.nom}" },
            datePlanifiee = e.datePlanifiee,
            dateRealisation = e.dateRealisation,
            zoneInspecte = e.zoneInspecte,
            observations = e.observations,
            scoreGlobal = e.scoreGlobal,
            checklistTemplateId = e.checklistTemplate?.id,
            checklistTemplateNom = e.checklistTemplate?.nom,
            nbItems = e.items.size,
            nbConformes = e.items.count { it.resultat == ResultatItem.CONFORME },
            nbNonConformes = e.items.count { it.resultat == ResultatItem.NON_CONFORME },
            items = e.items.map { toItemResponse(it) },
            createdAt = e.createdAt,
            updatedAt = e.updatedAt
        )
    }

    fun toItemResponse(e: InspectionItem) = InspectionItemResponse(
        id = e.id!!, ordre = e.ordre, libelle = e.libelle, section = e.section,
        resultat = e.resultat, commentaire = e.commentaire, photoUrl = e.photoUrl,
        critique = e.critique, poids = e.poids
    )

    fun toTemplateResponse(e: ChecklistTemplate) = ChecklistTemplateResponse(
        id = e.id!!, code = e.code, nom = e.nom, description = e.description,
        typeInspection = e.typeInspection, actif = e.actif, nbItems = e.items.size,
        items = e.items.map { toTemplateItemResponse(it) }
    )

    fun toTemplateItemResponse(e: ChecklistTemplateItem) = ChecklistTemplateItemResponse(
        id = e.id!!, ordre = e.ordre, libelle = e.libelle, section = e.section,
        description = e.description, critique = e.critique, poids = e.poids
    )
}
