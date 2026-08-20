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

    /**
     * Cookie de session de l'app mobile terrain — nom ET path distincts du cookie web :
     * le navigateur n'envoie jamais l'un à la place de l'autre (cloisonnement web/mobile,
     * deux sessions indépendantes possibles dans le même navigateur).
     */
    val terrainCookieName: String get() = "terrain${cookieName.replaceFirstChar { it.uppercase() }}"
    private val terrainCookiePath: String get() = "$cookiePath/terrain/auth"

    fun addRefreshTokenCookie(response: HttpServletResponse, refreshToken: String, customMaxAgeSeconds: Int? = null) {
        setCookie(response, cookieName, cookiePath, refreshToken, customMaxAgeSeconds ?: maxAgeSeconds)
    }

    fun clearRefreshTokenCookie(response: HttpServletResponse) {
        setCookie(response, cookieName, cookiePath, "", 0)
    }

    fun addTerrainRefreshTokenCookie(response: HttpServletResponse, refreshToken: String, customMaxAgeSeconds: Int? = null) {
        setCookie(response, terrainCookieName, terrainCookiePath, refreshToken, customMaxAgeSeconds ?: maxAgeSeconds)
    }

    fun clearTerrainRefreshTokenCookie(response: HttpServletResponse) {
        setCookie(response, terrainCookieName, terrainCookiePath, "", 0)
    }

    private fun setCookie(response: HttpServletResponse, name: String, path: String, value: String, maxAge: Int) {
        val parts = mutableListOf(
            "$name=$value",
            "Path=$path",
            "Max-Age=$maxAge",
            "HttpOnly",
            "SameSite=$sameSite"
        )
        if (secure) parts.add("Secure")
        response.addHeader("Set-Cookie", parts.joinToString("; "))
    }
}
