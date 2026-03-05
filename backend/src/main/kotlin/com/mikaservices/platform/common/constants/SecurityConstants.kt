package com.mikaservices.platform.common.constants

object SecurityConstants {
    const val JWT_HEADER = "Authorization"
    const val JWT_PREFIX = "Bearer "
    const val JWT_SECRET_ENV = "JWT_SECRET"
    const val JWT_EXPIRATION_ENV = "JWT_EXPIRATION_MS"
    
    // Valeurs par défaut (dev uniquement)
    const val DEFAULT_JWT_EXPIRATION_MS = 900000L // 15 minutes
    const val DEFAULT_REFRESH_TOKEN_EXPIRATION_MS = 604800000L // 7 jours

    const val SHORT_SESSION_MS = 3_600_000L        // 1 heure
    const val LONG_SESSION_MS  = 2_592_000_000L   // 30 jours
    
    // Endpoints publics (avec context-path /api : request.requestURI = "/api/...")
    val PUBLIC_PATHS = listOf(
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/verify-2fa",
        "/api/auth/login-policy",
        "/api/swagger-ui",
        "/api/v3/api-docs",
        "/api/webjars",
        "/api/ws"
    )
}
