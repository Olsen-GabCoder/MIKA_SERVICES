package com.mikaservices.platform.modules.user.scheduler

import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.modules.user.repository.UserRepository
import com.mikaservices.platform.modules.user.service.AuditLogService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate

/**
 * Envoie chaque soir à 18h30 (heure de Libreville) un email personnalisé
 * à chaque utilisateur actif avec notifications activées :
 *  - S'il a eu de l'activité : récapitulatif de ses actions du jour.
 *  - S'il n'a pas visité : message d'encouragement pour revenir.
 *
 * Route admin (déclenchement manuel) : POST /api/admin/scheduler/activite-quotidienne
 */
@Component
class ActiviteQuotidienneScheduler(
    private val userRepository: UserRepository,
    private val auditLogService: AuditLogService,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(ActiviteQuotidienneScheduler::class.java)

    @Scheduled(cron = "\${app.scheduler.activite-quotidienne-cron:0 30 18 * * *}", zone = "Africa/Libreville")
    fun envoyerBilansQuotidiens() {
        logger.info("[ActiviteQuotidienneScheduler] Démarrage envoi bilans quotidiens")
        val today = LocalDate.now()
        val dayOfWeek = today.dayOfWeek

        val utilisateurs = userRepository.findByActifTrue()
            .filter { it.emailNotificationsEnabled }

        if (utilisateurs.isEmpty()) {
            logger.info("[ActiviteQuotidienneScheduler] Aucun utilisateur éligible.")
            return
        }

        var nbEnvoyes = 0
        var nbErreurs = 0

        utilisateurs.forEach { user ->
            val userId = user.id ?: return@forEach
            try {
                val actionsAujourdhui = auditLogService.getTodayActivityForUser(userId)
                emailService.sendDailyActivityEmail(
                    to                = user.email,
                    prenom            = user.prenom,
                    nom               = user.nom,
                    sexe              = user.sexe,
                    actionsAujourdhui = actionsAujourdhui,
                    dayOfWeek         = dayOfWeek
                )
                nbEnvoyes++
            } catch (e: Exception) {
                nbErreurs++
                logger.error("[ActiviteQuotidienneScheduler] Erreur pour ${user.email}: ${e.message}")
            }
        }

        logger.info("[ActiviteQuotidienneScheduler] Bilans envoyés : $nbEnvoyes | Erreurs : $nbErreurs")
    }
}
