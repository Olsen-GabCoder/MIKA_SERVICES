package com.mikaservices.platform.modules.qualite.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class DocumentQualiteCreateRequest(
    @field:NotBlank @field:Size(max = 300) val titre: String,
    val description: String? = null,
)

data class DocumentQualiteUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val actif: Boolean? = null,
)
