package com.mikaservices.platform.modules.user.dto.request

import com.mikaservices.platform.common.validation.PasswordPolicy
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

/**
 * DTO pour la réinitialisation du mot de passe par un administrateur (sans ancien mot de passe).
 */
data class AdminResetPasswordRequest(
    @field:NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @field:Pattern(
        regexp = PasswordPolicy.REGEX,
        message = PasswordPolicy.MESSAGE
    )
    val newPassword: String
)
