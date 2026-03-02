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
 * Filtre de rate limiting sur les endpoints d'authentification sensibles.
 * Limite le nombre de tentatives par IP + endpoint pour contrer les attaques par force brute.
 */
@Component
@Order(-100)
class LoginRateLimitFilter(
    @Value("\${app.rate-limit.login-max-attempts:5}") private val maxAttempts: Int,
    @Value("\${app.rate-limit.login-window-minutes:1}") private val windowMinutes: Long
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(LoginRateLimitFilter::class.java)

    private val rateLimitedPaths = listOf(
        "/auth/login",
        "/auth/verify-2fa",
        "/auth/2fa/verify-setup",
        "/auth/forgot-password"
    )

    // Clé = "IP:endpoint" -> liste des timestamps
    private val attempts = ConcurrentHashMap<String, MutableList<Long>>()

    @Volatile
    private var lastCleanup = Instant.now().epochSecond

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        if (request.method != "POST") return true
        val path = request.servletPath
        return rateLimitedPaths.none { path.endsWith(it) }
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val ip = getClientIp(request)
        val endpoint = rateLimitedPaths.firstOrNull { request.servletPath.endsWith(it) } ?: ""
        val key = "$ip:$endpoint"
        val now = Instant.now().epochSecond
        val windowStart = now - windowMinutes * 60

        periodicCleanup(now)

        val ipAttempts = attempts.computeIfAbsent(key) { mutableListOf() }
        synchronized(ipAttempts) {
            ipAttempts.removeAll { it < windowStart }
            if (ipAttempts.size >= maxAttempts) {
                log.warn("Rate limit dépassé pour $key (${ipAttempts.size} tentatives)")
                response.status = 429
                response.contentType = MediaType.APPLICATION_JSON_VALUE
                response.characterEncoding = "UTF-8"
                val body = """{"status":429,"error":"Too Many Requests","message":"Trop de tentatives. Réessayez dans $windowMinutes minute(s)."}"""
                response.writer.write(body)
                return
            }
            ipAttempts.add(now)
        }

        filterChain.doFilter(request, response)
    }

    private fun periodicCleanup(nowSeconds: Long) {
        if (nowSeconds - lastCleanup < CLEANUP_INTERVAL_SECONDS) return
        lastCleanup = nowSeconds
        val windowStart = nowSeconds - windowMinutes * 60
        val keysToRemove = mutableListOf<String>()
        attempts.forEach { (key, timestamps) ->
            synchronized(timestamps) {
                timestamps.removeAll { it < windowStart }
                if (timestamps.isEmpty()) keysToRemove.add(key)
            }
        }
        keysToRemove.forEach { attempts.remove(it) }
        if (keysToRemove.isNotEmpty()) {
            log.debug("Rate limit cleanup: ${keysToRemove.size} entrée(s) expirée(s) supprimée(s)")
        }
    }

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return when {
            xForwardedFor != null && xForwardedFor.isNotBlank() ->
                xForwardedFor.split(",").first().trim()
            else -> request.remoteAddr ?: "unknown"
        }
    }

    companion object {
        private const val CLEANUP_INTERVAL_SECONDS = 600L // 10 minutes
    }
}
