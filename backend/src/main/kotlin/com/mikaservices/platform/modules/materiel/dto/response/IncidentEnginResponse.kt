package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import java.time.LocalDate
import java.time.LocalDateTime

data class IncidentEnginResponse(
    val id: Long,
    val enginId: Long,
    val enginCode: String,
    val typeIncident: TypeIncidentEngin,
    val gravite: GraviteIncident,
    val dateIncident: LocalDate,
    val description: String?,
    val lieu: String?,
    val signalePar: String?,
    val resolu: Boolean,
    val dateResolution: LocalDate?,
    val actionsCorrectives: String?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
