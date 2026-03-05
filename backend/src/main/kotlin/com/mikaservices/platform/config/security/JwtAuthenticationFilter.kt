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
import java.util.concurrent.ConcurrentHashMap

@Component
class JwtAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider,
    private val sessionRepository: SessionRepository
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)

    private data class SessionCacheEntry(val active: Boolean, val cachedAt: Long)

    private val sessionCache = ConcurrentHashMap<String, SessionCacheEntry>()

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        if (request.method == "OPTIONS") return true
        return SecurityConstants.PUBLIC_PATHS.any { path.startsWith(it) }
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val authHeader = request.getHeader(SecurityConstants.JWT_HEADER)

            if (authHeader != null && authHeader.startsWith(SecurityConstants.JWT_PREFIX)) {
                val token = authHeader.substring(SecurityConstants.JWT_PREFIX.length)

                if (jwtTokenProvider.validateToken(token)) {
                    val cached = sessionCache[token]
                    val now = System.currentTimeMillis()

                    val isActive = if (cached != null && (now - cached.cachedAt) < SESSION_CACHE_TTL_MS) {
                        cached.active
                    } else {
                        val session = sessionRepository.findByToken(token).orElse(null)
                        val active = session?.active == true
                        sessionCache[token] = SessionCacheEntry(active, now)

                        if (active) {
                            val lastActivity = session!!.lastActivity
                            val localNow = LocalDateTime.now()
                            if (lastActivity == null || ChronoUnit.MINUTES.between(lastActivity, localNow) >= ACTIVITY_THROTTLE_MINUTES) {
                                session.lastActivity = localNow
                                sessionRepository.save(session)
                            }
                        }
                        active
                    }

                    if (!isActive) {
                        filterChain.doFilter(request, response)
                        return
                    }

                    val username = jwtTokenProvider.getUsernameFromToken(token)
                    val roles = jwtTokenProvider.getRolesFromToken(token)
                    val authorities = roles.map { SimpleGrantedAuthority("ROLE_$it") }

                    val authentication = UsernamePasswordAuthenticationToken(username, null, authorities)
                    authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
                    SecurityContextHolder.getContext().authentication = authentication
                } else {
                    log.warn("Token JWT invalide: ${request.requestURI}")
                }
            }
        } catch (e: Exception) {
            log.error("Erreur JWT: ${e.message}", e)
        }

        filterChain.doFilter(request, response)
    }

    fun evictSession(token: String) {
        sessionCache.remove(token)
    }

    fun evictAllSessions() {
        sessionCache.clear()
    }

    companion object {
        private const val ACTIVITY_THROTTLE_MINUTES = 5L
        private const val SESSION_CACHE_TTL_MS = 60_000L
    }
}
