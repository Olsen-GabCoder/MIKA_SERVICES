package com.mikaservices.platform.modules.user.dto.request

import com.mikaservices.platform.common.validation.PasswordPolicy
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

data class ChangePasswordRequest(
    @field:NotBlank(message = "Le mot de passe actuel est obligatoire")
    val currentPassword: String,
    
    @field:NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @field:Pattern(
        regexp = PasswordPolicy.REGEX,
        message = PasswordPolicy.MESSAGE
    )
    val newPassword: String
)
