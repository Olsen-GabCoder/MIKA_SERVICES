package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.TypeIncidentEngin
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class IncidentEnginCreateRequest(
    @field:NotNull val typeIncident: TypeIncidentEngin,
    @field:NotNull val gravite: GraviteIncident,
    @field:NotNull val dateIncident: LocalDate,
    val description: String? = null,
    val lieu: String? = null,
    val signalePar: String? = null,
    /** Idempotence offline : UUID client, unique en base. */
    val clientRequestId: String? = null
)

data class IncidentEnginUpdateRequest(
    val typeIncident: TypeIncidentEngin? = null,
    val gravite: GraviteIncident? = null,
    val description: String? = null,
    val lieu: String? = null,
    val signalePar: String? = null,
    val resolu: Boolean? = null,
    val dateResolution: LocalDate? = null,
    val actionsCorrectives: String? = null
)
