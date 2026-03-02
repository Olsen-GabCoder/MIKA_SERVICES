package com.mikaservices.platform.config.security

import com.mikaservices.platform.common.constants.SecurityConstants
import com.mikaservices.platform.modules.auth.repository.SessionRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@Component
class JwtAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider,
    private val sessionRepository: SessionRepository
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        val method = request.method
        
        if (method == "OPTIONS") return true
        
        return SecurityConstants.PUBLIC_PATHS.any { path.startsWith(it) }
    }
    
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val authHeader = request.getHeader(SecurityConstants.JWT_HEADER)
            
            log.debug("JWT Filter - URI: ${request.requestURI}, Method: ${request.method}, Auth header present: ${authHeader != null}")
            
            if (authHeader != null && authHeader.startsWith(SecurityConstants.JWT_PREFIX)) {
                val token = authHeader.substring(SecurityConstants.JWT_PREFIX.length)
                
                if (jwtTokenProvider.validateToken(token)) {
                    val session = sessionRepository.findByToken(token).orElse(null)
                    if (session == null || !session.active) {
                        log.warn("Session inactive ou absente pour le token: ${request.requestURI}")
                        filterChain.doFilter(request, response)
                        return
                    }

                    val username = jwtTokenProvider.getUsernameFromToken(token)
                    val roles = jwtTokenProvider.getRolesFromToken(token)
                    
                    val authorities = roles.map { SimpleGrantedAuthority("ROLE_$it") }
                    
                    val authentication = UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        authorities
                    )
                    authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
                    
                    SecurityContextHolder.getContext().authentication = authentication
                    log.debug("Utilisateur authentifié: $username avec rôles: $roles")

                    val now = LocalDateTime.now()
                    val lastActivity = session.lastActivity
                    if (lastActivity == null || ChronoUnit.MINUTES.between(lastActivity, now) >= ACTIVITY_THROTTLE_MINUTES) {
                        session.lastActivity = now
                        sessionRepository.save(session)
                    }
                } else {
                    log.warn("Token JWT invalide pour la requête: ${request.requestURI}")
                }
            } else {
                log.debug("Pas de header Authorization pour: ${request.method} ${request.requestURI}")
            }
        } catch (e: Exception) {
            log.error("Erreur lors de l'authentification JWT: ${e.message}", e)
        }
        
        filterChain.doFilter(request, response)
    }

    companion object {
        private const val ACTIVITY_THROTTLE_MINUTES = 5L
    }
}
