package com.mikaservices.platform.modules.fournisseur.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class FournisseurCreateRequest(
    @field:NotBlank @field:Size(max = 200) val nom: String,
    val adresse: String? = null,
    val telephone: String? = null,
    val email: String? = null,
    val contactNom: String? = null,
    val specialite: String? = null
)

data class FournisseurUpdateRequest(
    val nom: String? = null,
    val adresse: String? = null,
    val telephone: String? = null,
    val email: String? = null,
    val contactNom: String? = null,
    val specialite: String? = null,
    val noteEvaluation: Int? = null,
    val actif: Boolean? = null
)
