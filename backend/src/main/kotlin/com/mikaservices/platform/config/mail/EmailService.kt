package com.mikaservices.platform.config.mail

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    @Value("\${app.mail.from:noreply@mikaservices.com}") private val from: String,
    @Value("\${app.mail.frontend-base-url:http://localhost:5173}") private val frontendBaseUrl: String
) {
    private val logger = LoggerFactory.getLogger(EmailService::class.java)

    /**
     * Envoie un email de bienvenue au nouvel utilisateur avec son mot de passe temporaire
     * et l'invite à le modifier à la première connexion.
     * Utilise le même chemin d'envoi que les autres notifications (sendGenericNotification).
     */
    fun sendWelcomeEmail(to: String, prenom: String, temporaryPassword: String) {
        val loginLink = "$frontendBaseUrl/login"
        val subject = "Bienvenue sur MIKA Services — Vos identifiants de connexion"
        val body = """
            Bonjour $prenom,

            Votre compte MIKA Services a été créé. Vous pouvez vous connecter avec les identifiants suivants :

            Email : $to
            Mot de passe temporaire : $temporaryPassword

            Connexion : $loginLink

            Pour des raisons de sécurité, vous devrez modifier ce mot de passe lors de votre première connexion.

            Si vous n'êtes pas à l'origine de cette création de compte, contactez immédiatement votre administrateur.

            —
            MIKA Services
        """.trimIndent()
        sendGenericNotification(to, subject, body, "bienvenue")
    }

    /**
     * Envoie un email pour la réinitialisation du mot de passe.
     * Contient un lien vers le frontend avec le token.
     */
    fun sendPasswordResetEmail(to: String, prenom: String, token: String) {
        val resetLink = "$frontendBaseUrl/reset-password?token=$token"
        val subject = "MIKA Services — Réinitialisation de votre mot de passe"
        val body = """
            Bonjour $prenom,

            Vous avez demandé une réinitialisation de votre mot de passe MIKA Services.

            Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :
            $resetLink

            Ce lien est valide pendant 1 heure. Après ce délai, vous devrez effectuer une nouvelle demande.

            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.

            —
            MIKA Services
        """.trimIndent()
        sendGenericNotification(to, subject, body, "reset mot de passe")
    }

    /**
     * Notification « nouvelle connexion » (optionnel, activé par app.mail.notify-on-login).
     */
    fun sendLoginNotification(to: String, prenom: String, ip: String?, userAgent: String?) {
        val subject = "MIKA Services — Nouvelle connexion détectée"
        val ipInfo = ip?.takeIf { it.isNotBlank() } ?: "non disponible"
        val uaInfo = userAgent?.takeIf { it.isNotBlank() }?.take(200) ?: "non disponible"
        val body = """
            Bonjour $prenom,

            Une connexion à votre compte MIKA Services a été enregistrée.

            Adresse IP : $ipInfo
            Navigateur / appareil : $uaInfo

            Si vous n'êtes pas à l'origine de cette connexion, changez immédiatement votre mot de passe et contactez votre administrateur.

            —
            MIKA Services
        """.trimIndent()
        sendGenericNotification(to, subject, body, "login")
    }

    /**
     * Notification « mot de passe modifié ».
     */
    fun sendPasswordChangedNotification(to: String, prenom: String) {
        val subject = "MIKA Services — Votre mot de passe a été modifié"
        val body = """
            Bonjour $prenom,

            Le mot de passe de votre compte MIKA Services a été modifié avec succès.

            Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.

            —
            MIKA Services
        """.trimIndent()
        sendGenericNotification(to, subject, body, "password changed")
    }

    /**
     * Notification « 2FA activée ».
     */
    fun send2FAEnabledNotification(to: String, prenom: String) {
        val subject = "MIKA Services — Authentification à deux facteurs activée"
        val body = """
            Bonjour $prenom,

            L'authentification à deux facteurs (2FA) a été activée sur votre compte MIKA Services.

            Vous devrez désormais saisir un code à usage unique à chaque connexion.

            Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur.

            —
            MIKA Services
        """.trimIndent()
        sendGenericNotification(to, subject, body, "2FA enabled")
    }

    /**
     * Notification « 2FA désactivée ».
     */
    fun send2FADisabledNotification(to: String, prenom: String) {
        val subject = "MIKA Services — Authentification à deux facteurs désactivée"
        val body = """
            Bonjour $prenom,

            L'authentification à deux facteurs (2FA) a été désactivée sur votre compte MIKA Services.

            Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur et réactivez la 2FA.

            —
            MIKA Services
        """.trimIndent()
        sendGenericNotification(to, subject, body, "2FA disabled")
    }

    private fun sendGenericNotification(to: String, subject: String, body: String, logLabel: String) {
        try {
            val message = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")
            helper.setFrom(from)
            helper.setTo(to)
            helper.setSubject(subject)
            helper.setText(body, false)
            mailSender.send(message)
            logger.info("Email $logLabel envoyé à $to")
        } catch (e: Exception) {
            var cause: Throwable? = e.cause
            val causeChain = buildString {
                append(e.javaClass.name).append(": ").append(e.message)
                while (cause != null) {
                    append(" | cause: ").append(cause.javaClass.name).append(": ").append(cause.message)
                    cause = cause.cause
                }
            }
            logger.error("Échec envoi email [$logLabel] vers $to — $causeChain", e)
            throw e
        }
    }

    /**
     * Envoi asynchrone du mail de bienvenue (retry après échec synchrone).
     * Appelé depuis UserService en cas d'échec du premier envoi pour réessayer hors contexte HTTP/transaction.
     */
    @Async
    fun sendWelcomeEmailAsync(to: String, prenom: String, temporaryPassword: String) {
        try {
            sendWelcomeEmail(to, prenom, temporaryPassword)
            logger.info("Email de bienvenue (async) envoyé à $to")
        } catch (e: Exception) {
            logger.error("Échec envoi email de bienvenue (async) à $to: ${e.javaClass.simpleName} - ${e.message}", e)
        }
    }
}
