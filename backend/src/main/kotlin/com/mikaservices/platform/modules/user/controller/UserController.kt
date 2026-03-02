package com.mikaservices.platform.modules.user.controller

import com.mikaservices.platform.common.constants.ApiConstants
import com.mikaservices.platform.modules.auth.dto.response.SessionResponse
import com.mikaservices.platform.modules.auth.service.AuthService
import com.mikaservices.platform.modules.user.dto.request.AdminResetPasswordRequest
import com.mikaservices.platform.modules.user.dto.request.ChangePasswordRequest
import com.mikaservices.platform.modules.user.dto.request.NotificationPreferencesUpdateRequest
import com.mikaservices.platform.modules.user.dto.request.SessionPreferencesUpdateRequest
import com.mikaservices.platform.modules.user.dto.request.UserCreateRequest
import com.mikaservices.platform.modules.user.dto.request.UserUpdateRequest
import com.mikaservices.platform.modules.user.dto.response.LoginHistoryEntryResponse
import com.mikaservices.platform.modules.user.dto.response.UserForMessagingResponse
import com.mikaservices.platform.modules.user.dto.response.UserResponse
import com.mikaservices.platform.modules.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import com.mikaservices.platform.modules.user.dto.response.AuditLogResponse
import org.springframework.core.io.Resource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/users")
@Tag(name = "Utilisateurs", description = "API de gestion des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
class UserController(
    private val userService: UserService,
    private val authService: AuthService
) {
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Créer un utilisateur", description = "Création d'un nouvel utilisateur")
    fun create(
        @Valid @RequestBody request: UserCreateRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.create(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(user)
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Liste des utilisateurs", description = "Récupération de la liste paginée des utilisateurs avec filtres (search, actif, roleId) et tri")
    fun findAll(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) actif: Boolean?,
        @RequestParam(required = false) roleId: Long?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<UserResponse>> {
        val users = userService.findAll(search, actif, roleId, pageable)
        return ResponseEntity.ok(users)
    }
    
    @GetMapping("/me")
    @Operation(summary = "Utilisateur connecté", description = "Récupération des informations de l'utilisateur connecté")
    fun getCurrentUser(): ResponseEntity<UserResponse> {
        val user = userService.getCurrentUser()
        return ResponseEntity.ok(user)
    }

    @GetMapping("/me/peers")
    @Operation(summary = "Liste des destinataires messagerie", description = "Autres utilisateurs actifs (pour choisir un destinataire). Accessible à tout utilisateur connecté.")
    fun getPeersForMessaging(): ResponseEntity<List<UserForMessagingResponse>> {
        val peers = userService.getPeersForMessaging()
        return ResponseEntity.ok(peers)
    }

    @PostMapping("/me/photo", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Photo de profil", description = "Upload de la photo de profil de l'utilisateur connecté")
    fun uploadPhoto(@RequestParam("file") file: MultipartFile): ResponseEntity<UserResponse> {
        val user = userService.uploadPhoto(file)
        return ResponseEntity.ok(user)
    }

    @GetMapping("/me/photo")
    @Operation(summary = "Consulter ma photo", description = "Récupération de la photo de profil de l'utilisateur connecté")
    fun getMyPhoto(): ResponseEntity<Resource> {
        val resource = userService.getPhotoResource()
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .body(resource)
    }

    @PutMapping("/me/password")
    @Operation(summary = "Changer mon mot de passe", description = "Changement du mot de passe de l'utilisateur connecté")
    fun changeMyPassword(
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<Map<String, String>> {
        userService.changeMyPassword(request)
        return ResponseEntity.ok(mapOf("message" to "Mot de passe modifié avec succès"))
    }

    @PatchMapping("/me/preferences/notifications")
    @Operation(summary = "Préférences de notifications", description = "Mise à jour des préférences de notifications par e-mail (utilisateur connecté)")
    fun updateMyNotificationPreferences(
        @RequestBody request: NotificationPreferencesUpdateRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.updateMyNotificationPreferences(request)
        return ResponseEntity.ok(user)
    }

    @PatchMapping("/me/preferences/session")
    @Operation(summary = "Préférences de session", description = "Durée de session par défaut à la connexion : SHORT (1 h) ou LONG (5 h)")
    fun updateMySessionPreferences(
        @RequestBody request: SessionPreferencesUpdateRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.updateMySessionPreferences(request)
        return ResponseEntity.ok(user)
    }

    @GetMapping("/me/login-history")
    @Operation(summary = "Mon historique des connexions", description = "Dernières connexions (date, IP, appareil)")
    fun getMyLoginHistory(): ResponseEntity<List<LoginHistoryEntryResponse>> {
        val user = userService.getCurrentUser()
        val history = userService.getMyLoginHistory(user.id)
        return ResponseEntity.ok(history)
    }

    @GetMapping("/me/sessions")
    @Operation(summary = "Mes sessions actives", description = "Liste des sessions actives de l'utilisateur connecté")
    fun getMySessions(httpRequest: HttpServletRequest): ResponseEntity<List<SessionResponse>> {
        val user = userService.getCurrentUser()
        val currentToken = httpRequest.getHeader("Authorization")?.removePrefix("Bearer ")?.trim()
        val sessions = authService.getMySessions(user.id!!, currentToken)
        return ResponseEntity.ok(sessions)
    }

    @DeleteMapping("/me/sessions/{sessionId}")
    @Operation(summary = "Révoquer une session", description = "Déconnexion d'une session (l'utilisateur doit en être propriétaire)")
    fun revokeMySession(@PathVariable sessionId: Long): ResponseEntity<Unit> {
        val user = userService.getCurrentUser()
        authService.revokeMySession(user.id!!, sessionId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Utilisateur par ID", description = "Récupération d'un utilisateur par son ID")
    fun findById(
        @PathVariable id: Long
    ): ResponseEntity<UserResponse> {
        val user = userService.findById(id)
        return ResponseEntity.ok(user)
    }

    @GetMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Photo de profil par ID", description = "Récupération de la photo de profil d'un utilisateur (admin)")
    fun getPhotoById(@PathVariable id: Long): ResponseEntity<Resource> {
        val resource = userService.getPhotoResourceForUser(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .body(resource)
    }

    @GetMapping("/{id}/audit-logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Historique d'activité", description = "Récupération de l'historique d'activité d'un utilisateur")
    fun getAuditLogs(
        @PathVariable id: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<AuditLogResponse>> {
        return ResponseEntity.ok(userService.getAuditLogs(id, pageable))
    }
    
    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Utilisateur par email", description = "Récupération d'un utilisateur par son email")
    fun findByEmail(
        @PathVariable email: String
    ): ResponseEntity<UserResponse> {
        val user = userService.findByEmail(email)
        return ResponseEntity.ok(user)
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Mettre à jour un utilisateur", description = "Mise à jour des informations d'un utilisateur")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UserUpdateRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.update(id, request)
        return ResponseEntity.ok(user)
    }
    
    @PutMapping("/{id}/password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Changer le mot de passe", description = "Changement du mot de passe d'un utilisateur (avec ancien mot de passe)")
    fun changePassword(
        @PathVariable id: Long,
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<Map<String, String>> {
        userService.changePassword(id, request)
        return ResponseEntity.ok(mapOf("message" to "Mot de passe modifié avec succès"))
    }

    @PutMapping("/{id}/admin-reset-password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Réinitialiser le mot de passe (admin)", description = "Réinitialisation du mot de passe d'un utilisateur par un administrateur, sans ancien mot de passe")
    fun adminResetPassword(
        @PathVariable id: Long,
        @Valid @RequestBody request: AdminResetPasswordRequest
    ): ResponseEntity<Map<String, String>> {
        userService.adminResetPassword(id, request)
        return ResponseEntity.ok(mapOf("message" to "Mot de passe réinitialisé avec succès"))
    }

    @PostMapping("/{id}/admin-disable-2fa")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Désactiver la 2FA (admin)", description = "Désactivation de l'authentification à deux facteurs d'un utilisateur par un administrateur")
    fun adminDisable2FA(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        userService.adminDisable2FA(id)
        return ResponseEntity.ok(mapOf("message" to "Authentification à deux facteurs désactivée"))
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Supprimer un utilisateur", description = "Suppression définitive de l'utilisateur et des données liées (sessions, tokens reset, références nullifiées)")
    fun delete(
        @PathVariable id: Long
    ): ResponseEntity<Map<String, String>> {
        userService.delete(id)
        return ResponseEntity.ok(mapOf("message" to ApiConstants.SUCCESS_DELETED))
    }
}
