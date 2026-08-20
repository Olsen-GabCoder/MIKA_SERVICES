package com.mikaservices.platform.modules.auth.controller

import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.modules.auth.config.AuthCookieHelper
import com.mikaservices.platform.modules.auth.dto.request.LoginRequest
import com.mikaservices.platform.modules.auth.dto.request.RefreshTokenRequest
import com.mikaservices.platform.modules.auth.dto.request.Verify2FARequest
import com.mikaservices.platform.modules.auth.dto.response.AuthResponse
import com.mikaservices.platform.modules.auth.dto.response.LoginResult
import com.mikaservices.platform.modules.auth.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Auth dédiée à l'app mobile terrain : mêmes comptes et même AuthService que le web,
 * mais cookie de refresh distinct (nom + Path=/api/terrain/auth) → le navigateur ne
 * mélange jamais les deux sessions. Une connexion web ne peut plus écraser la session
 * mobile (et inversement) dans le même navigateur.
 */
@RestController
@RequestMapping("/terrain/auth")
@Tag(name = "Auth Terrain", description = "Authentification de l'application mobile terrain (session cloisonnée du web)")
class TerrainAuthController(
    private val authService: AuthService,
    private val authCookieHelper: AuthCookieHelper
) {

    @PostMapping("/login")
    @Operation(summary = "Connexion terrain", description = "Authentification mobile. Si 2FA activé, retourne requires2FA + tempToken ; sinon pose le cookie terrain et retourne les tokens.")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<Any> {
        return when (val result = authService.login(request, httpRequest)) {
            is LoginResult.Success -> {
                val cookieMaxAge = result.response.sessionExpiresIn?.toInt()
                authCookieHelper.addTerrainRefreshTokenCookie(httpResponse, result.response.refreshToken, cookieMaxAge)
                ResponseEntity.ok(result.response)
            }
            is LoginResult.Requires2FA -> ResponseEntity.ok(result.pending)
        }
    }

    @PostMapping("/verify-2fa")
    @Operation(summary = "Vérifier le code 2FA (terrain)", description = "Valide le code TOTP et pose le cookie terrain")
    fun verify2FA(
        @RequestBody request: Verify2FARequest,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<AuthResponse> {
        val response = authService.verify2FA(request, httpRequest)
        val cookieMaxAge = response.sessionExpiresIn?.toInt()
        authCookieHelper.addTerrainRefreshTokenCookie(httpResponse, response.refreshToken, cookieMaxAge)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renouvellement de token terrain", description = "Renouvelle le token d'accès via le cookie terrain httpOnly")
    fun refreshToken(
        @RequestBody(required = false) request: RefreshTokenRequest?,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<AuthResponse> {
        val refreshToken = httpRequest.cookies?.find { it.name == authCookieHelper.terrainCookieName }
            ?.value?.takeIf { it.isNotBlank() }
            ?: request?.refreshToken?.takeIf { it.isNotBlank() }
            ?: throw BadRequestException("Refresh token manquant (cookie ou body)")
        val response = authService.refreshToken(RefreshTokenRequest(refreshToken))
        val cookieMaxAge = response.sessionExpiresIn?.toInt()
        authCookieHelper.addTerrainRefreshTokenCookie(httpResponse, response.refreshToken, cookieMaxAge)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion terrain", description = "Désactive la session et efface le cookie terrain")
    fun logout(
        @RequestHeader("Authorization") authorization: String,
        httpResponse: HttpServletResponse
    ): ResponseEntity<Map<String, String>> {
        val token = authorization.removePrefix("Bearer ")
        val currentUser = org.springframework.security.core.context.SecurityContextHolder.getContext().authentication?.name
        authService.logout(token, currentUser)
        authCookieHelper.clearTerrainRefreshTokenCookie(httpResponse)
        return ResponseEntity.ok(mapOf("message" to "Déconnexion réussie"))
    }
}
