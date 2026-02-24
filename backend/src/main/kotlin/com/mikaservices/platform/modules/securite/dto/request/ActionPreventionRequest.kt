package com.mikaservices.platform.modules.securite.dto.request

import com.mikaservices.platform.common.enums.StatutActionPrevention
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class ActionPreventionCreateRequest(
    val incidentId: Long? = null,
    @field:NotBlank(message = "Le titre est obligatoire") @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    val responsableId: Long? = null,
    val dateEcheance: LocalDate? = null
)

data class ActionPreventionUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val statut: StatutActionPrevention? = null,
    val responsableId: Long? = null,
    val dateEcheance: LocalDate? = null,
    val dateRealisation: LocalDate? = null,
    val commentaireVerification: String? = null
)
