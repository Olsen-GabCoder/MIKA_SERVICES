package com.mikaservices.platform.modules.securite.dto.request

import com.mikaservices.platform.common.enums.NiveauRisque
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class RisqueCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,
    @field:NotBlank(message = "Le titre est obligatoire") @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    @field:NotNull(message = "Le niveau de risque est obligatoire")
    val niveau: NiveauRisque,
    val probabilite: Int? = null,
    val impact: Int? = null,
    val zoneConcernee: String? = null,
    val mesuresPrevention: String? = null
)

data class RisqueUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val niveau: NiveauRisque? = null,
    val probabilite: Int? = null,
    val impact: Int? = null,
    val zoneConcernee: String? = null,
    val mesuresPrevention: String? = null,
    val actif: Boolean? = null
)
