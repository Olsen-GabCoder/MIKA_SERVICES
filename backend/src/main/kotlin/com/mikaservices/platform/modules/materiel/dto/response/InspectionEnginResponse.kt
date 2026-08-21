package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.EtatGeneralInspection
import com.mikaservices.platform.modules.materiel.dto.request.ChecklistItemDto
import java.time.LocalDate
import java.time.LocalDateTime

data class InspectionEnginResponse(
    val id: Long,
    val enginId: Long,
    val dateInspection: LocalDate,
    val inspectePar: String?,
    val compteurHeures: Int?,
    val checklist: List<ChecklistItemDto>,
    val etatGeneral: EtatGeneralInspection,
    val anomaliesDetectees: Boolean,
    val commentaire: String?,
    val signature: String?,
    val incidentCreeId: Long?,
    val photoUrls: List<String>?,
    val createdAt: LocalDateTime?
)
