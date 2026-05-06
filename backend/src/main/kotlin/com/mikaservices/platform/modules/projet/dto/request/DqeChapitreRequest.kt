package com.mikaservices.platform.modules.projet.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class DqeChapitreCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,

    @field:NotBlank(message = "Le numéro du chapitre est obligatoire")
    @field:Size(max = 20)
    val numero: String,

    @field:NotBlank(message = "La désignation est obligatoire")
    @field:Size(max = 500)
    val designation: String,

    val ordre: Int? = null
)

data class DqeChapitreUpdateRequest(
    @field:Size(max = 20)
    val numero: String? = null,

    @field:Size(max = 500)
    val designation: String? = null,

    val ordre: Int? = null
)
