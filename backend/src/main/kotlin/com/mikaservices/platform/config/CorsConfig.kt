package com.mikaservices.platform.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class CorsConfig {
    
    private val logger = LoggerFactory.getLogger(CorsConfig::class.java)
    
    @Value("\${app.cors.allowed-origins:}")
    private val allowedOrigins: String = ""
    
    @Value("\${app.mail.frontend-base-url:}")
    private val frontendBaseUrl: String = ""
    
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        
        // Origines de base pour le développement
        val origins = mutableListOf(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        )
        
        // CORS_ALLOWED_ORIGINS (liste séparée par des virgules)
        if (allowedOrigins.isNotBlank()) {
            allowedOrigins.split(",")
                .map { it.trim() }
                .filter { it.isNotBlank() }
                .forEach { origin ->
                    if (origin !in origins) {
                        origins.add(origin)
                    }
                }
        }
        
        // FRONTEND_BASE_URL utilisée aussi comme origine autorisée
        if (frontendBaseUrl.isNotBlank()) {
            val url = frontendBaseUrl.trim().removeSuffix("/")
            if (url !in origins) {
                origins.add(url)
            }
        }
        
        // En prod, autoriser tous les sous-domaines Render (*.onrender.com) si aucune origine HTTPS n'a été configurée
        val hasHttpsOrigin = origins.any { it.startsWith("https://") }
        if (!hasHttpsOrigin) {
            origins.add("https://*.onrender.com")
        }
        
        configuration.allowedOriginPatterns = origins
        logger.info("CORS allowed origins/patterns: {}", origins)
        
        // Méthodes HTTP autorisées
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        
        // Headers autorisés
        configuration.allowedHeaders = listOf("*")
        
        // Headers exposés
        configuration.exposedHeaders = listOf("Authorization")
        
        // Autoriser les credentials
        configuration.allowCredentials = true
        
        // Durée de cache pour les requêtes preflight
        configuration.maxAge = 3600L
        
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        
        return source
    }
}
