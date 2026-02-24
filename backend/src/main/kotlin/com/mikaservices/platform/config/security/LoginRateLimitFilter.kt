package com.mikaservices.platform.config.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.annotation.Order
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * Filtre de rate limiting sur l'endpoint de login.
 * Limite le nombre de tentatives par IP pour limiter les attaques par force brute.
 */
@Component
@Order(-100) // Avant les autres filtres
class LoginRateLimitFilter(
    @Value("\${app.rate-limit.login-max-attempts:5}") private val maxAttempts: Int,
    @Value("\${app.rate-limit.login-window-minutes:1}") private val windowMinutes: Long
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(LoginRateLimitFilter::class.java)

    // IP -> liste des timestamps des tentatives (en secondes)
    private val attempts = ConcurrentHashMap<String, MutableList<Long>>()

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.servletPath
        val method = request.method
        return !(method == "POST" && path.endsWith("/auth/login"))
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val ip = getClientIp(request)
        val now = Instant.now().epochSecond
        val windowStart = now - windowMinutes * 60

        val ipAttempts = attempts.computeIfAbsent(ip) { mutableListOf() }
        synchronized(ipAttempts) {
            // Supprimer les tentatives hors de la fenêtre
            ipAttempts.removeAll { it < windowStart }
            if (ipAttempts.size >= maxAttempts) {
                log.warn("Rate limit dépassé pour l'IP: $ip (${ipAttempts.size} tentatives)")
                response.status = 429 // Too Many Requests
                response.contentType = MediaType.APPLICATION_JSON_VALUE
                response.characterEncoding = "UTF-8"
                val body = """{"status":429,"error":"Too Many Requests","message":"Trop de tentatives de connexion. Réessayez dans $windowMinutes minute(s)."}"""
                response.writer.write(body)
                return
            }
            ipAttempts.add(now)
        }

        filterChain.doFilter(request, response)
    }

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return when {
            xForwardedFor != null && xForwardedFor.isNotBlank() ->
                xForwardedFor.split(",").first().trim()
            else -> request.remoteAddr ?: "unknown"
        }
    }
}
