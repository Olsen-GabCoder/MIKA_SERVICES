package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.EtatGeneralInspection
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class ChecklistItemDto(
    val code: String,
    val label: String,
    val ok: Boolean,
    val commentaire: String? = null
)

data class InspectionEnginCreateRequest(
    @field:NotNull(message = "La date d'inspection est obligatoire")
    val dateInspection: LocalDate,
    val inspectePar: String? = null,
    val compteurHeures: Int? = null,
    val checklist: List<ChecklistItemDto> = emptyList(),
    val etatGeneral: EtatGeneralInspection = EtatGeneralInspection.BON,
    val commentaire: String? = null,
    val signature: String? = null,
    /** URLs Cloudinary des photos d'inspection. */
    val photoUrls: List<String>? = null,
    /** Idempotence offline : UUID client, unique en base. */
    val clientRequestId: String? = null
)
