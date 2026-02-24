package com.mikaservices.platform.modules.auth.controller

import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.modules.auth.config.AuthCookieHelper
import com.mikaservices.platform.modules.auth.dto.request.ForgotPasswordRequest
import com.mikaservices.platform.modules.auth.dto.request.LoginRequest
import com.mikaservices.platform.modules.auth.dto.request.RefreshTokenRequest
import com.mikaservices.platform.modules.auth.dto.request.ResetPasswordRequest
import com.mikaservices.platform.modules.auth.dto.request.Verify2FARequest
import com.mikaservices.platform.modules.auth.dto.request.Verify2FASetupRequest
import com.mikaservices.platform.modules.auth.dto.request.Disable2FARequest
import com.mikaservices.platform.modules.auth.dto.response.AuthResponse
import com.mikaservices.platform.modules.auth.dto.response.Login2FAPendingResponse
import com.mikaservices.platform.modules.auth.dto.response.LoginResult
import com.mikaservices.platform.modules.auth.dto.response.Setup2FAResponse
import com.mikaservices.platform.modules.auth.service.AuthService
import com.mikaservices.platform.modules.user.dto.response.UserResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentification", description = "API d'authentification et gestion des sessions")
class AuthController(
    private val authService: AuthService,
    private val authCookieHelper: AuthCookieHelper,
    @Value("\${app.auth.refresh-cookie.name:refreshToken}") private val refreshCookieName: String
) {
    
    @PostMapping("/login")
    @Operation(summary = "Connexion", description = "Authentification. Si 2FA activé, retourne requires2FA + tempToken ; sinon retourne les tokens.")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<Any> {
        return when (val result = authService.login(request, httpRequest)) {
            is LoginResult.Success -> {
                authCookieHelper.addRefreshTokenCookie(httpResponse, result.response.refreshToken)
                ResponseEntity.ok(result.response)
            }
            is LoginResult.Requires2FA -> ResponseEntity.ok(result.pending)
        }
    }

    @PostMapping("/verify-2fa")
    @Operation(summary = "Vérifier le code 2FA", description = "Valide le code TOTP et retourne les tokens (après login avec 2FA activé)")
    fun verify2FA(
        @Valid @RequestBody request: Verify2FARequest,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<AuthResponse> {
        val response = authService.verify2FA(request, httpRequest)
        authCookieHelper.addRefreshTokenCookie(httpResponse, response.refreshToken)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/2fa/setup")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Configurer 2FA", description = "Génère un secret et un QR code pour l'application d'authentification")
    fun setup2FA(): ResponseEntity<Setup2FAResponse> {
        return ResponseEntity.ok(authService.setup2FA())
    }

    @PostMapping("/2fa/verify-setup")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Valider la configuration 2FA", description = "Vérifie le code et active la 2FA")
    fun verifySetup2FA(
        @Valid @RequestBody request: Verify2FASetupRequest
    ): ResponseEntity<UserResponse> {
        val user = authService.verifySetup2FA(request)
        return ResponseEntity.ok(user)
    }

    @PostMapping("/2fa/disable")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Désactiver 2FA", description = "Désactive la 2FA après vérification du mot de passe")
    fun disable2FA(
        @Valid @RequestBody request: Disable2FARequest
    ): ResponseEntity<Map<String, String>> {
        authService.disable2FA(request)
        return ResponseEntity.ok(mapOf("message" to "Authentification à deux facteurs désactivée"))
    }
    
    @PostMapping("/refresh")
    @Operation(summary = "Renouvellement de token", description = "Renouvelle le token d'accès (refresh token en cookie httpOnly ou dans le body)")
    fun refreshToken(
        @RequestBody(required = false) request: RefreshTokenRequest?,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<AuthResponse> {
        val refreshToken = getRefreshTokenFromRequest(request, httpRequest)
            ?: throw BadRequestException("Refresh token manquant (cookie ou body)")
        val response = authService.refreshToken(RefreshTokenRequest(refreshToken))
        authCookieHelper.addRefreshTokenCookie(httpResponse, response.refreshToken)
        return ResponseEntity.ok(response)
    }
    
    private fun getRefreshTokenFromRequest(request: RefreshTokenRequest?, httpRequest: HttpServletRequest): String? {
        httpRequest.cookies?.find { it.name == refreshCookieName }?.value?.takeIf { it.isNotBlank() }?.let { return it }
        return request?.refreshToken?.takeIf { it.isNotBlank() }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Mot de passe oublié", description = "Envoie un email avec un lien pour réinitialiser le mot de passe")
    fun forgotPassword(
        @Valid @RequestBody request: ForgotPasswordRequest
    ): ResponseEntity<Map<String, String>> {
        authService.forgotPassword(request)
        return ResponseEntity.ok(mapOf("message" to "Si l'email existe, un lien de réinitialisation vous a été envoyé."))
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe", description = "Définit un nouveau mot de passe avec le token reçu par email")
    fun resetPassword(
        @Valid @RequestBody request: ResetPasswordRequest
    ): ResponseEntity<Map<String, String>> {
        authService.resetPassword(request)
        return ResponseEntity.ok(mapOf("message" to "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter."))
    }
    
    @PostMapping("/logout")
    @Operation(summary = "Déconnexion", description = "Déconnexion de l'utilisateur (désactivation de la session)")
    fun logout(
        @RequestHeader("Authorization") authorization: String,
        httpResponse: HttpServletResponse
    ): ResponseEntity<Map<String, String>> {
        val token = authorization.removePrefix("Bearer ")
        authService.logout(token)
        authCookieHelper.clearRefreshTokenCookie(httpResponse)
        return ResponseEntity.ok(mapOf("message" to "Déconnexion réussie"))
    }
    
    @PostMapping("/logout-all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Déconnexion de toutes les sessions", description = "Déconnecte un utilisateur de toutes ses sessions actives (admin uniquement)")
    fun logoutAll(
        @RequestParam userId: Long
    ): ResponseEntity<Map<String, String>> {
        authService.logoutAll(userId)
        return ResponseEntity.ok(mapOf("message" to "Toutes les sessions ont été désactivées"))
    }
}
