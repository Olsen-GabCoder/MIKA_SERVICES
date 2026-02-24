package com.mikaservices.platform.config.websocket

import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig : WebSocketMessageBrokerConfigurer {
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        // Active un simple broker en mémoire pour envoyer des messages aux clients
        config.enableSimpleBroker("/topic", "/queue", "/user")
        
        // Préfixe pour les messages destinés à l'application
        config.setApplicationDestinationPrefixes("/app")
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // Endpoint WebSocket pour les clients
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*") // En dev, autoriser toutes les origines
            .withSockJS() // Support SockJS pour compatibilité navigateurs
    }
}
