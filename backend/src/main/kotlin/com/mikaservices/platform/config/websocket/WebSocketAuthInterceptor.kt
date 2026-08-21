package com.mikaservices.platform.config.websocket

import com.mikaservices.platform.config.security.JwtTokenProvider
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Component

@Component
class WebSocketAuthInterceptor(
    private val jwtTokenProvider: JwtTokenProvider,
    private val userRepository: UserRepository,
    private val mouvementEnginService: MouvementEnginService,
) : ChannelInterceptor {

    private val logger = LoggerFactory.getLogger(WebSocketAuthInterceptor::class.java)

    private val TRANSFERT_TOPIC = Regex("^/topic/transfert/(\\d+)/position$")

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)
            ?: return message

        when (accessor.command) {
            StompCommand.CONNECT -> handleConnect(accessor)
            StompCommand.SUBSCRIBE -> handleSubscribe(accessor)
            else -> {}
        }

        return message
    }

    private fun handleConnect(accessor: StompHeaderAccessor) {
        val authHeader = accessor.getFirstNativeHeader("Authorization")
        if (authHeader.isNullOrBlank() || !authHeader.startsWith("Bearer ")) {
            logger.warn("[WebSocket] CONNECT rejete : header Authorization manquant")
            throw IllegalArgumentException("Token manquant pour la connexion WebSocket")
        }

        val token = authHeader.substring(7)
        if (!jwtTokenProvider.validateToken(token)) {
            logger.warn("[WebSocket] CONNECT rejete : token invalide ou expire")
            throw IllegalArgumentException("Token WebSocket invalide ou expire")
        }

        val username = jwtTokenProvider.getUsernameFromToken(token)
        val roles = jwtTokenProvider.getRolesFromToken(token)
        val authorities = roles.map { SimpleGrantedAuthority("ROLE_$it") }
        val authentication = UsernamePasswordAuthenticationToken(username, null, authorities)

        accessor.user = authentication

        logger.debug("[WebSocket] CONNECT authentifie : {} ({})", username, roles.joinToString())
    }

    private fun handleSubscribe(accessor: StompHeaderAccessor) {
        val destination = accessor.destination ?: return
        val match = TRANSFERT_TOPIC.matchEntire(destination) ?: return

        // Verifier que l'utilisateur a le droit de voir ce transfert
        val auth = accessor.user as? UsernamePasswordAuthenticationToken ?: run {
            logger.warn("[WebSocket] SUBSCRIBE rejete : utilisateur non authentifie sur {}", destination)
            throw IllegalArgumentException("Non authentifie")
        }

        val transfertId = match.groupValues[1].toLongOrNull() ?: return

        try {
            // findById applique deja le filtre de visibilite (404 si hors perimetre)
            mouvementEnginService.findById(transfertId)
        } catch (_: Exception) {
            logger.warn("[WebSocket] SUBSCRIBE rejete : {} n'a pas acces au transfert {}", auth.name, transfertId)
            throw IllegalArgumentException("Acces refuse au transfert $transfertId")
        }
    }
}
