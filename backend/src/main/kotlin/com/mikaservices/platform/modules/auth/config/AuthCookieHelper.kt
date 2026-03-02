package com.mikaservices.platform.modules.auth.config

import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component

@Component
class AuthCookieHelper(
    @Value("\${app.auth.refresh-cookie.name:refreshToken}") private val cookieName: String,
    @Value("\${app.auth.refresh-cookie.path:/api}") private val cookiePath: String,
    @Value("\${app.auth.refresh-cookie.max-age-seconds:604800}") private val maxAgeSeconds: Int,
    @Value("\${app.auth.refresh-cookie.secure:#{null}}") private val secureOverride: Boolean?,
    @Value("\${app.auth.refresh-cookie.same-site:Lax}") private val sameSite: String,
    private val environment: Environment
) {
    private val secure: Boolean
        get() = secureOverride ?: !environment.activeProfiles.any { it.equals("dev", ignoreCase = true) }


    fun addRefreshTokenCookie(response: HttpServletResponse, refreshToken: String, customMaxAgeSeconds: Int? = null) {
        val effectiveMaxAge = customMaxAgeSeconds ?: maxAgeSeconds
        val parts = mutableListOf(
            "$cookieName=${refreshToken}",
            "Path=$cookiePath",
            "Max-Age=$effectiveMaxAge",
            "HttpOnly",
            "SameSite=$sameSite"
        )
        if (secure) parts.add("Secure")
        response.addHeader("Set-Cookie", parts.joinToString("; "))
    }

    fun clearRefreshTokenCookie(response: HttpServletResponse) {
        val parts = mutableListOf(
            "$cookieName=",
            "Path=$cookiePath",
            "Max-Age=0",
            "HttpOnly",
            "SameSite=$sameSite"
        )
        if (secure) parts.add("Secure")
        response.addHeader("Set-Cookie", parts.joinToString("; "))
    }
}
