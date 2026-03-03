package com.mikaservices.platform.modules.auth.dto.request

data class RefreshTokenRequest(
    /** Optionnel quand le refresh token est envoyé en cookie httpOnly. */
    val refreshToken: String? = null
)
