package com.mikaservices.platform.modules.auth.dto.request

import com.mikaservices.platform.common.validation.PasswordPolicy
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

data class ResetPasswordRequest(
    @field:NotBlank(message = "Le token est obligatoire")
    val token: String,

    @field:NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @field:Pattern(
        regexp = PasswordPolicy.REGEX,
        message = PasswordPolicy.MESSAGE
    )
    val newPassword: String
)
