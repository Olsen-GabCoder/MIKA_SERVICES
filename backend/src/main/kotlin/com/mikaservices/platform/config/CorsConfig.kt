package com.mikaservices.platform.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class CorsConfig {
    
    @Value("\${app.cors.allowed-origins:}")
    private val allowedOrigins: String = ""
    
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
        
        // Ajouter les origines configurées via variable d'environnement
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
        
        configuration.allowedOrigins = origins
        
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
