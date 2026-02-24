package com.mikaservices.platform.common.constants

object SecurityConstants {
    const val JWT_HEADER = "Authorization"
    const val JWT_PREFIX = "Bearer "
    const val JWT_SECRET_ENV = "JWT_SECRET"
    const val JWT_EXPIRATION_ENV = "JWT_EXPIRATION_MS"
    
    // Valeurs par défaut (dev uniquement)
    const val DEFAULT_JWT_EXPIRATION_MS = 900000L // 15 minutes
    const val DEFAULT_REFRESH_TOKEN_EXPIRATION_MS = 604800000L // 7 jours
    
    // Endpoints publics (chemins directs sans context-path)
    val PUBLIC_PATHS = listOf(
        "/auth/login",
        "/auth/refresh",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/verify-2fa",
        "/swagger-ui",
        "/v3/api-docs",
        "/webjars",
        "/ws"
    )
}
