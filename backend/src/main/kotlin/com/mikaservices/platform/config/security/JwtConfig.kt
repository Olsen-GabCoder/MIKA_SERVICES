package com.mikaservices.platform.config.security

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "app.jwt")
data class JwtConfig(
    var secret: String = "",
    var expiration: Long = 900000L, // 15 minutes par défaut
    var refreshExpiration: Long = 604800000L // 7 jours par défaut
)
