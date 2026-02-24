package com.mikaservices.platform.modules.auth.dto.request

import jakarta.validation.constraints.NotBlank

data class RefreshTokenRequest(
    @field:NotBlank(message = "Le refresh token est obligatoire")
    val refreshToken: String
)
