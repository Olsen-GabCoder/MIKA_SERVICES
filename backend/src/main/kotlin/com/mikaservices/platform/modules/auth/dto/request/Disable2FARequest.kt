package com.mikaservices.platform.modules.auth.dto.request

import jakarta.validation.constraints.NotBlank

data class Disable2FARequest(
    @field:NotBlank(message = "Le mot de passe est obligatoire")
    val password: String
)
