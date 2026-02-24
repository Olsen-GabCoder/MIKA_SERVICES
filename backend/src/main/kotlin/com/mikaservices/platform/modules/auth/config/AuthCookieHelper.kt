package com.mikaservices.platform.modules.auth.config

import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class AuthCookieHelper(
    @Value("\${app.auth.refresh-cookie.name:refreshToken}") private val cookieName: String,
    @Value("\${app.auth.refresh-cookie.path:/api}") private val cookiePath: String,
    @Value("\${app.auth.refresh-cookie.max-age-seconds:604800}") private val maxAgeSeconds: Int,
    @Value("\${app.auth.refresh-cookie.secure:false}") private val secure: Boolean,
    @Value("\${app.auth.refresh-cookie.same-site:Lax}") private val sameSite: String
) {

    fun addRefreshTokenCookie(response: HttpServletResponse, refreshToken: String) {
        val parts = mutableListOf(
            "$cookieName=${refreshToken}",
            "Path=$cookiePath",
            "Max-Age=$maxAgeSeconds",
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
