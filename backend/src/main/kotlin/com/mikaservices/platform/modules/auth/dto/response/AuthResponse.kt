package com.mikaservices.platform.modules.auth.dto.response

import com.mikaservices.platform.modules.user.dto.response.UserResponse

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
)
