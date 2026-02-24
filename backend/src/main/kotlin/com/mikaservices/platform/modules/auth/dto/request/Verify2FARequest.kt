package com.mikaservices.platform.modules.auth.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

data class Verify2FARequest(
    @field:NotBlank(message = "Le token temporaire est obligatoire")
    val tempToken: String,

    @field:NotBlank(message = "Le code 2FA est obligatoire")
    @field:Pattern(regexp = "^[0-9]{6}\$", message = "Le code doit contenir 6 chiffres")
    val code: String
)
