package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.TypeClient
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class ClientCreateRequest(
    @field:NotBlank(message = "Le code est obligatoire")
    @field:Size(max = 50)
    val code: String,

    @field:NotBlank(message = "Le nom est obligatoire")
    @field:Size(max = 200)
    val nom: String,

    @field:NotNull(message = "Le type est obligatoire")
    val type: TypeClient,

    val ministere: String? = null,
    val telephone: String? = null,
    val email: String? = null,
    val adresse: String? = null,
    val contactPrincipal: String? = null,
    val telephoneContact: String? = null
)

data class ClientUpdateRequest(
    val nom: String? = null,
    val type: TypeClient? = null,
    val ministere: String? = null,
    val telephone: String? = null,
    val email: String? = null,
    val adresse: String? = null,
    val contactPrincipal: String? = null,
    val telephoneContact: String? = null
)
