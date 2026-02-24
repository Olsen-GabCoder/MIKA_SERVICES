package com.mikaservices.platform.modules.auth.scheduler

import com.mikaservices.platform.modules.auth.repository.PasswordResetTokenRepository
import com.mikaservices.platform.modules.auth.repository.SessionRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Tâche planifiée pour nettoyer les sessions et tokens de reset expirés.
 */
@Component
class SessionCleanupScheduler(
    private val sessionRepository: SessionRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository
) {
    private val logger = LoggerFactory.getLogger(SessionCleanupScheduler::class.java)

    /**
     * Nettoie les sessions expirées (tous les jours à 3h du matin).
     */
    @Scheduled(cron = "\${app.scheduler.session-cleanup-cron:0 0 3 * * ?}")
    @Transactional
    fun cleanupExpiredSessions() {
        val now = LocalDateTime.now()
        try {
            sessionRepository.deleteExpiredSessions(now)
            logger.info("Nettoyage des sessions expirées terminé")
        } catch (e: Exception) {
            logger.error("Erreur lors du nettoyage des sessions: ${e.message}", e)
        }
    }

    /**
     * Nettoie les tokens de reset mot de passe expirés (tous les jours à 4h du matin).
     */
    @Scheduled(cron = "\${app.scheduler.password-reset-cleanup-cron:0 0 4 * * ?}")
    @Transactional
    fun cleanupExpiredPasswordResetTokens() {
        val now = LocalDateTime.now()
        try {
            passwordResetTokenRepository.deleteExpiredTokens(now)
            logger.info("Nettoyage des tokens de reset mot de passe expirés terminé")
        } catch (e: Exception) {
            logger.error("Erreur lors du nettoyage des tokens reset: ${e.message}", e)
        }
    }
}
