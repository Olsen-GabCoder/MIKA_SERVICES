package com.mikaservices.platform.modules.user.service

import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

/**
 * Fournit l'utilisateur connecté à partir du contexte de sécurité (JWT).
 * Utilisé pour les vérifications d'autorisation (ex. chef de projet sur ses projets).
 */
@Service
class CurrentUserService(
    private val userRepository: UserRepository
) {

    /**
     * Retourne l'utilisateur connecté ou null si non authentifié.
     */
    fun getCurrentUser(): User? {
        val email = getCurrentUsername() ?: return null
        return userRepository.findByEmail(email).orElse(null)
    }

    /**
     * Retourne l'ID de l'utilisateur connecté ou null.
     */
    fun getCurrentUserId(): Long? = getCurrentUser()?.id

    /**
     * Retourne le nom d'utilisateur (email) du contexte de sécurité.
     */
    fun getCurrentUsername(): String? {
        val auth: Authentication? = SecurityContextHolder.getContext().authentication
        if (auth == null || !auth.isAuthenticated || auth.principal !is String) return null
        return auth.principal as String
    }

    /**
     * Vérifie si l'utilisateur connecté a le rôle Super Admin ou Admin (accès global).
     */
    fun hasGlobalAdminRole(): Boolean {
        val user = getCurrentUser() ?: return false
        return user.roles.any { it.code == "SUPER_ADMIN" || it.code == "ADMIN" }
    }

    /**
     * Vérifie si l'utilisateur connecté peut modifier le projet : soit il a un rôle admin global,
     * soit il est chef de projet (CHEF_PROJET) et responsable de ce projet.
     */
    fun canEditProjet(responsableProjetId: Long?): Boolean {
        val user = getCurrentUser() ?: return false
        if (hasGlobalAdminRole()) return true
        if (user.roles.none { it.code == "CHEF_PROJET" }) return false
        return user.id != null && responsableProjetId != null && user.id == responsableProjetId
    }
}
