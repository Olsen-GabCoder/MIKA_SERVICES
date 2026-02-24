package com.mikaservices.platform.modules.auth.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

data class Verify2FASetupRequest(
    @field:NotBlank(message = "Le code est obligatoire")
    @field:Pattern(regexp = "^[0-9]{6,8}\$", message = "Le code doit contenir 6 à 8 chiffres")
    val code: String
)
