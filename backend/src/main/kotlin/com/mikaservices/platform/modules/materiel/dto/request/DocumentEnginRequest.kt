package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.TypeDocumentEngin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class DocumentEnginCreateRequest(
    @field:NotNull val typeDocument: TypeDocumentEngin,
    @field:NotBlank val nom: String,
    val urlFichier: String? = null,
    val dateExpiration: LocalDate? = null,
    val commentaire: String? = null
)

data class DocumentEnginUpdateRequest(
    val typeDocument: TypeDocumentEngin? = null,
    val nom: String? = null,
    val urlFichier: String? = null,
    val dateExpiration: LocalDate? = null,
    val commentaire: String? = null
)
