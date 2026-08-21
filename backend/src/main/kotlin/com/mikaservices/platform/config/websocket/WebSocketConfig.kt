package com.mikaservices.platform.config.websocket

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    @Value("\${app.cors.allowed-origins:}") private val allowedOrigins: String,
    private val webSocketAuthInterceptor: WebSocketAuthInterceptor,
) : WebSocketMessageBrokerConfigurer {
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        // Active un simple broker en mémoire pour envoyer des messages aux clients
        config.enableSimpleBroker("/topic", "/queue", "/user")
        
        // Préfixe pour les messages destinés à l'application
        config.setApplicationDestinationPrefixes("/app")
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // Endpoint WebSocket pour les clients — mêmes origines que le CORS HTTP (CORS_ALLOWED_ORIGINS)
        val origins = (listOf("http://localhost:5173", "http://127.0.0.1:5173") +
            allowedOrigins.split(",").map { it.trim() }.filter { it.isNotBlank() })
            .distinct()
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(*origins.toTypedArray())
            .withSockJS() // Support SockJS pour compatibilité navigateurs
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(webSocketAuthInterceptor)
    }
}
