package com.mikaservices.platform.modules.auth.dto.request

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:NotBlank(message = "L'email est obligatoire")
    @field:Email(message = "L'email doit être valide")
    val email: String,
    
    @field:NotBlank(message = "Le mot de passe est obligatoire")
    val password: String,

    val rememberMe: Boolean = false
)
