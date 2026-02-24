package com.mikaservices.platform.modules.user.service

import com.mikaservices.platform.modules.user.entity.AuditLog
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.AuditLogRepository
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

/**
 * Service de journalisation des actions sensibles pour l'audit.
 * Enregistre qui a fait quoi, sur quel utilisateur cible, avec détails optionnels et IP.
 */
@Service
class AuditLogService(
    private val auditLogRepository: AuditLogRepository
) {

    /**
     * Enregistre une action dans l'audit.
     * @param targetUser Utilisateur concerné par l'action (cible), null si action globale
     * @param module Module métier (ex: "USER", "AUTH")
     * @param action Action effectuée (ex: "CREATE", "UPDATE", "DEACTIVATE", "PASSWORD_RESET")
     * @param details Détails libres (ex: "Mot de passe réinitialisé par l'administrateur")
     * @param ipAddress Adresse IP de l'acteur si disponible
     */
    fun log(
        targetUser: User?,
        module: String,
        action: String,
        details: String? = null,
        ipAddress: String? = null
    ) {
        val actor = SecurityContextHolder.getContext().authentication?.name ?: "system"
        val detailsWithActor = details?.let { "$it | Par: $actor" } ?: "Par: $actor"
        val log = AuditLog(
            user = targetUser,
            action = action,
            module = module,
            details = detailsWithActor,
            ipAddress = ipAddress
        )
        auditLogRepository.save(log)
    }
}
