package com.mikaservices.platform.modules.user.service

import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.modules.communication.service.MessageService
import com.mikaservices.platform.modules.communication.service.NotificationService
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.DayOfWeek
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/**
 * Envoi des résumés (digest) quotidiens et hebdomadaires par e-mail.
 * Les utilisateurs actifs avec dailyDigestEnabled ou weeklyDigestEnabled reçoivent un e-mail
 * à l'heure configurée (digestTime, fuseau serveur). Hebdo = samedi à la même heure.
 */
@Service
class DigestService(
    private val userRepository: UserRepository,
    private val notificationService: NotificationService,
    private val messageService: MessageService,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(DigestService::class.java)
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    /**
     * À appeler périodiquement (ex. toutes les heures). Envoie les digest aux utilisateurs
     * dont l'heure (digestTime) correspond à l'heure courante (serveur). Quotidien : chaque jour ;
     * hebdo : le samedi.
     */
    @Transactional(readOnly = true)
    fun processDigests() {
        val now = LocalTime.now()
        val currentHourMin = now.format(timeFormatter)
        val isSaturday = java.time.LocalDate.now().dayOfWeek == DayOfWeek.SATURDAY

        val candidates = userRepository.findByActifTrue()
            .filter { it.emailNotificationsEnabled }
            .filter { (it.dailyDigestEnabled || it.weeklyDigestEnabled) && effectiveDigestTime(it) == currentHourMin }

        if (candidates.isEmpty()) return

        for (user in candidates) {
            try {
                val userId = user.id ?: continue
                val notifCount = notificationService.countNonLues(userId)
                val messageCount = messageService.countNonLus(userId)

                if (user.dailyDigestEnabled) {
                    emailService.sendDailyDigestEmail(user.email, user.prenom, notifCount, messageCount)
                    logger.debug("Digest quotidien envoyé à ${user.email}")
                }
                if (user.weeklyDigestEnabled && isSaturday) {
                    emailService.sendWeeklyDigestEmail(user.email, user.prenom, notifCount, messageCount)
                    logger.debug("Digest hebdo envoyé à ${user.email}")
                }
            } catch (e: Exception) {
                logger.warn("Erreur envoi digest pour ${user.email}: ${e.message}")
            }
        }
    }

    private fun effectiveDigestTime(user: User): String =
        user.digestTime?.takeIf { it.matches(Regex("^([01]?[0-9]|2[0-3]):[0-5][0-9]$")) } ?: "18:00"
}
