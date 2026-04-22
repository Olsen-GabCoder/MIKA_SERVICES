package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.ResultatItem
import com.mikaservices.platform.modules.qshe.enums.StatutInspection
import com.mikaservices.platform.modules.qshe.enums.TypeInspection
import java.time.LocalDate
import java.time.LocalDateTime

data class InspectionResponse(
    val id: Long,
    val reference: String,
    val titre: String,
    val description: String?,
    val typeInspection: TypeInspection,
    val statut: StatutInspection,
    val projetId: Long,
    val projetNom: String,
    val sousProjetId: Long?,
    val sousProjetNom: String?,
    val inspecteurId: Long?,
    val inspecteurNom: String?,
    val datePlanifiee: LocalDate?,
    val dateRealisation: LocalDate?,
    val zoneInspecte: String?,
    val observations: String?,
    val scoreGlobal: Int?,
    val checklistTemplateId: Long?,
    val checklistTemplateNom: String?,
    val nbItems: Int,
    val nbConformes: Int,
    val nbNonConformes: Int,
    val items: List<InspectionItemResponse>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class InspectionItemResponse(
    val id: Long,
    val ordre: Int,
    val libelle: String,
    val section: String?,
    val resultat: ResultatItem,
    val commentaire: String?,
    val photoUrl: String?,
    val critique: Boolean,
    val poids: Int
)

data class ChecklistTemplateResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val description: String?,
    val typeInspection: TypeInspection?,
    val actif: Boolean,
    val nbItems: Int,
    val items: List<ChecklistTemplateItemResponse>
)

data class ChecklistTemplateItemResponse(
    val id: Long,
    val ordre: Int,
    val libelle: String,
    val section: String?,
    val description: String?,
    val critique: Boolean,
    val poids: Int
)
