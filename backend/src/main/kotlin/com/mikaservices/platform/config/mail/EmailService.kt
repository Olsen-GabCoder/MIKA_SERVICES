package com.mikaservices.platform.config.mail

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    private val restTemplate: RestTemplate,
    @Value("\${app.mail.from:noreply@mikaservices.com}") private val from: String,
    @Value("\${app.mail.frontend-base-url:http://localhost:5173}") private val frontendBaseUrl: String,
    @Value("\${app.mail.brevo-api-key:}") private val brevoApiKey: String,
    @Value("\${app.mail.resend-api-key:}") private val resendApiKey: String
) {
    private val logger = LoggerFactory.getLogger(EmailService::class.java)

    /**
     * URL de base du frontend pour les liens dans les emails.
     * En prod (Railway), si la config pointe vers localhost, on utilise FRONTEND_BASE_URL (env).
     */
    private val baseUrl: String = run {
        val fromProp = frontendBaseUrl.trim()
        val useEnv = fromProp.isBlank() || fromProp.lowercase().contains("localhost")
        val effective = if (useEnv) {
            System.getenv("FRONTEND_BASE_URL")?.trim()?.takeIf { it.isNotBlank() } ?: fromProp
        } else fromProp
        effective.removeSuffix("/").ifBlank { fromProp }
    }

    /** Uniquement si baseUrl est une URL absolue (http/https), pour éviter "invalid URL: host missing" chez Brevo. */
    private val baseUrlForLinks: String
        get() = if (baseUrl.isNotBlank() && (baseUrl.startsWith("http://") || baseUrl.startsWith("https://"))) baseUrl else ""

    private fun linkOrPlaceholder(path: String, fallbackHref: String = "#"): String =
        if (baseUrlForLinks.isNotBlank()) "$baseUrlForLinks$path" else fallbackHref

    private fun htmlEscape(s: String): String = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;")

    private fun signatureHtml(): String {
        val logoPart = if (baseUrlForLinks.isNotBlank()) {
            val logoUrl = "$baseUrlForLinks/Logo_mika_services.png"
            """<p style="margin-top: 0.5em;"><img src="$logoUrl" alt="MIKA Services" style="max-width: 200px; height: auto;" /></p>"""
        } else ""
        return """
            <p style="margin-top: 1.5em; color: #666; font-size: 0.95em;">—<br>L'équipe MIKA Services</p>
            $logoPart
        """.trimIndent()
    }

    /**
     * Envoie un email de bienvenue au nouvel utilisateur avec son mot de passe temporaire,
     * l'invite à le modifier à la première connexion et recommande l'activation de la 2FA.
     */
    fun sendWelcomeEmail(to: String, prenom: String, temporaryPassword: String) {
        val loginLink = linkOrPlaceholder("/login")
        val profileLink = linkOrPlaceholder("/profile")
        val subject = "Bienvenue sur MIKA Services — Vos identifiants de connexion"
        val plainBody = """
            Bonjour $prenom,

            Votre compte MIKA Services a été créé. Vous pouvez vous connecter avec les identifiants suivants :

            Email : $to
            Mot de passe temporaire : $temporaryPassword

            Connexion : $loginLink

            Pour des raisons de sécurité, vous devrez modifier ce mot de passe lors de votre première connexion.

            Nous vous recommandons également d'activer l'authentification à deux facteurs (2FA) pour renforcer la sécurité de votre compte. La 2FA n'est pas obligatoire mais vivement conseillée. Vous pourrez l'activer depuis votre profil après connexion : $profileLink

            Si vous n'êtes pas à l'origine de cette création de compte, contactez immédiatement votre administrateur.

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Votre compte MIKA Services a été créé. Vous pouvez vous connecter avec les identifiants suivants :</p>
            <p><strong>Email :</strong> ${htmlEscape(to)}<br><strong>Mot de passe temporaire :</strong> ${htmlEscape(temporaryPassword)}</p>
            <p><a href="$loginLink" style="color: #e65100;">Se connecter</a></p>
            <p>Pour des raisons de sécurité, vous devrez <strong>modifier ce mot de passe lors de votre première connexion</strong>.</p>
            <p>Nous vous recommandons également d'<strong>activer l'authentification à deux facteurs (2FA)</strong> pour renforcer la sécurité de votre compte. La 2FA n'est pas obligatoire mais vivement conseillée. Vous pourrez l'activer depuis votre <a href="$profileLink">profil</a> après connexion.</p>
            <p>Si vous n'êtes pas à l'origine de cette création de compte, contactez immédiatement votre administrateur.</p>
            ${signatureHtml()}
        """.trimIndent()
        sendGenericNotification(to, subject, plainBody, htmlBody, "bienvenue")
    }

    /**
     * Envoie un email pour la réinitialisation du mot de passe.
     * Contient un lien vers le frontend avec le token.
     */
    fun sendPasswordResetEmail(to: String, prenom: String, token: String) {
        val resetLink = linkOrPlaceholder("/reset-password?token=$token")
        val subject = "MIKA Services — Réinitialisation de votre mot de passe"
        val plainBody = """
            Bonjour $prenom,

            Vous avez demandé une réinitialisation de votre mot de passe MIKA Services.

            Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :
            $resetLink

            Ce lien est valide pendant 1 heure. Après ce délai, vous devrez effectuer une nouvelle demande.

            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Vous avez demandé une réinitialisation de votre mot de passe MIKA Services.</p>
            <p><a href="$resetLink" style="color: #e65100;">Définir un nouveau mot de passe</a></p>
            <p>Ce lien est valide pendant 1 heure. Après ce délai, vous devrez effectuer une nouvelle demande.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.</p>
            ${signatureHtml()}
        """.trimIndent()
        sendGenericNotification(to, subject, plainBody, htmlBody, "reset mot de passe")
    }

    /**
     * Notification « nouvelle connexion » (optionnel, activé par app.mail.notify-on-login).
     */
    fun sendLoginNotification(to: String, prenom: String, ip: String?, userAgent: String?) {
        val subject = "MIKA Services — Nouvelle connexion détectée"
        val ipInfo = ip?.takeIf { it.isNotBlank() } ?: "non disponible"
        val uaInfo = userAgent?.takeIf { it.isNotBlank() }?.take(200) ?: "non disponible"
        val plainBody = """
            Bonjour $prenom,

            Une connexion à votre compte MIKA Services a été enregistrée.

            Adresse IP : $ipInfo
            Navigateur / appareil : $uaInfo

            Si vous n'êtes pas à l'origine de cette connexion, changez immédiatement votre mot de passe et contactez votre administrateur.

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Une connexion à votre compte MIKA Services a été enregistrée.</p>
            <p><strong>Adresse IP :</strong> ${htmlEscape(ipInfo)}<br><strong>Navigateur / appareil :</strong> ${htmlEscape(uaInfo)}</p>
            <p>Si vous n'êtes pas à l'origine de cette connexion, changez immédiatement votre mot de passe et contactez votre administrateur.</p>
            ${signatureHtml()}
        """.trimIndent()
        sendGenericNotification(to, subject, plainBody, htmlBody, "login")
    }

    /**
     * Notification « mot de passe modifié ».
     */
    fun sendPasswordChangedNotification(to: String, prenom: String) {
        val subject = "MIKA Services — Votre mot de passe a été modifié"
        val plainBody = """
            Bonjour $prenom,

            Le mot de passe de votre compte MIKA Services a été modifié avec succès.

            Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Le mot de passe de votre compte MIKA Services a été modifié avec succès.</p>
            <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.</p>
            ${signatureHtml()}
        """.trimIndent()
        sendGenericNotification(to, subject, plainBody, htmlBody, "password changed")
    }

    /**
     * Notification « 2FA activée ».
     */
    fun send2FAEnabledNotification(to: String, prenom: String) {
        val subject = "MIKA Services — Authentification à deux facteurs activée"
        val plainBody = """
            Bonjour $prenom,

            L'authentification à deux facteurs (2FA) a été activée sur votre compte MIKA Services.

            Vous devrez désormais saisir un code à usage unique à chaque connexion.

            Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur.

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>L'authentification à deux facteurs (2FA) a été activée sur votre compte MIKA Services.</p>
            <p>Vous devrez désormais saisir un code à usage unique à chaque connexion.</p>
            <p>Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur.</p>
            ${signatureHtml()}
        """.trimIndent()
        sendGenericNotification(to, subject, plainBody, htmlBody, "2FA enabled")
    }

    /**
     * Notification « 2FA désactivée ».
     */
    fun send2FADisabledNotification(to: String, prenom: String) {
        val subject = "MIKA Services — Authentification à deux facteurs désactivée"
        val plainBody = """
            Bonjour $prenom,

            L'authentification à deux facteurs (2FA) a été désactivée sur votre compte MIKA Services.

            Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur et réactivez la 2FA.

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>L'authentification à deux facteurs (2FA) a été désactivée sur votre compte MIKA Services.</p>
            <p>Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur et réactivez la 2FA.</p>
            ${signatureHtml()}
        """.trimIndent()
        sendGenericNotification(to, subject, plainBody, htmlBody, "2FA disabled")
    }

    /**
     * E-mail pour une notification in-app (si l'utilisateur a activé les notifications par e-mail).
     * N'échoue pas l'appelant : les erreurs sont loggées.
     */
    fun sendInAppNotificationEmail(to: String, prenom: String, titre: String, contenu: String?, lien: String?) {
        val effectiveLink = lien?.takeIf { it.isNotBlank() } ?: linkOrPlaceholder("/notifications")
        val subject = "MIKA Services — Notification : ${titre.take(60)}${if (titre.length > 60) "…" else ""}"
        val plainBody = """
            Bonjour $prenom,

            Vous avez une nouvelle notification sur MIKA Services :

            $titre
            ${contenu?.take(500)?.lines()?.joinToString(" ") ?: ""}

            Consulter : $effectiveLink

            —
            L'équipe MIKA Services
        """.trimIndent()
        val bodyEscaped = contenu?.take(500)?.let { htmlEscape(it) } ?: ""
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Vous avez une nouvelle notification sur MIKA Services :</p>
            <p><strong>${htmlEscape(titre.take(200))}</strong></p>
            ${if (bodyEscaped.isNotEmpty()) "<p>${bodyEscaped}</p>" else ""}
            <p><a href="$effectiveLink" style="color: #e65100;">Voir la notification</a></p>
            ${signatureHtml()}
        """.trimIndent()
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "notification in-app")
        } catch (e: Exception) {
            logger.warn("Envoi email notification in-app échoué vers $to: ${e.message}")
        }
    }

    /**
     * E-mail pour un nouveau message interne (si le destinataire a activé les notifications par e-mail).
     * N'échoue pas l'appelant : les erreurs sont loggées.
     */
    fun sendNewMessageEmail(to: String, prenom: String, expediteurNom: String, sujet: String?, contenuExtrait: String? = null) {
        val sujetSafe = sujet.orEmpty()
        val messagerieLink = linkOrPlaceholder("/messagerie")
        val subject = "MIKA Services — Nouveau message : ${sujetSafe.take(50)}${if (sujetSafe.length > 50) "…" else ""}"
        val extract = contenuExtrait?.take(300)?.lines()?.joinToString(" ") ?: ""
        val plainBody = """
            Bonjour $prenom,

            Vous avez reçu un nouveau message de $expediteurNom sur MIKA Services.

            Sujet : $sujetSafe
            ${if (extract.isNotEmpty()) "\n$extract\n" else ""}

            Consulter votre messagerie : $messagerieLink

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Vous avez reçu un nouveau message de <strong>${htmlEscape(expediteurNom)}</strong> sur MIKA Services.</p>
            <p><strong>Sujet :</strong> ${htmlEscape(sujetSafe.take(200))}</p>
            ${if (contenuExtrait?.isNotBlank() == true) "<p>${htmlEscape(contenuExtrait.take(200))}</p>" else ""}
            <p><a href="$messagerieLink" style="color: #e65100;">Ouvrir la messagerie</a></p>
            ${signatureHtml()}
        """.trimIndent()
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "nouveau message")
        } catch (e: Exception) {
            logger.warn("Envoi email nouveau message échoué vers $to: ${e.message}")
        }
    }

    /**
     * Résumé quotidien par e-mail (notifications et messages non lus).
     * N'échoue pas l'appelant : les erreurs sont loggées.
     */
    fun sendDailyDigestEmail(to: String, prenom: String, unreadNotificationsCount: Long, unreadMessagesCount: Long) {
        val appLink = linkOrPlaceholder("/notifications")
        val messagerieLink = linkOrPlaceholder("/messagerie")
        val subject = "MIKA Services — Résumé du jour"
        val plainBody = """
            Bonjour $prenom,

            Voici votre résumé MIKA Services pour aujourd'hui :

            • Notifications non lues : $unreadNotificationsCount
            • Messages non lus : $unreadMessagesCount

            Consulter les notifications : $appLink
            Consulter la messagerie : $messagerieLink

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Voici votre résumé MIKA Services pour aujourd'hui :</p>
            <ul>
                <li><strong>Notifications non lues :</strong> $unreadNotificationsCount</li>
                <li><strong>Messages non lus :</strong> $unreadMessagesCount</li>
            </ul>
            <p><a href="$appLink" style="color: #e65100;">Voir les notifications</a> — <a href="$messagerieLink" style="color: #e65100;">Ouvrir la messagerie</a></p>
            ${signatureHtml()}
        """.trimIndent()
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "digest quotidien")
        } catch (e: Exception) {
            logger.warn("Envoi digest quotidien échoué vers $to: ${e.message}")
        }
    }

    /**
     * Résumé hebdomadaire par e-mail (même contenu que quotidien).
     * N'échoue pas l'appelant : les erreurs sont loggées.
     */
    fun sendWeeklyDigestEmail(to: String, prenom: String, unreadNotificationsCount: Long, unreadMessagesCount: Long) {
        val appLink = linkOrPlaceholder("/notifications")
        val messagerieLink = linkOrPlaceholder("/messagerie")
        val subject = "MIKA Services — Résumé de la semaine"
        val plainBody = """
            Bonjour $prenom,

            Voici votre résumé hebdomadaire MIKA Services :

            • Notifications non lues : $unreadNotificationsCount
            • Messages non lus : $unreadMessagesCount

            Consulter les notifications : $appLink
            Consulter la messagerie : $messagerieLink

            —
            L'équipe MIKA Services
        """.trimIndent()
        val htmlBody = """
            <p>Bonjour ${htmlEscape(prenom)},</p>
            <p>Voici votre résumé hebdomadaire MIKA Services :</p>
            <ul>
                <li><strong>Notifications non lues :</strong> $unreadNotificationsCount</li>
                <li><strong>Messages non lus :</strong> $unreadMessagesCount</li>
            </ul>
            <p><a href="$appLink" style="color: #e65100;">Voir les notifications</a> — <a href="$messagerieLink" style="color: #e65100;">Ouvrir la messagerie</a></p>
            ${signatureHtml()}
        """.trimIndent()
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "digest hebdo")
        } catch (e: Exception) {
            logger.warn("Envoi digest hebdo échoué vers $to: ${e.message}")
        }
    }

    private fun resolveBrevoApiKey(): String {
        if (brevoApiKey.isNotBlank()) return brevoApiKey.trim()
        System.getenv("BREVO_API_KEY")?.trim()?.let { if (it.isNotBlank()) return it }
        System.getenv("brevo_api_key")?.trim()?.let { if (it.isNotBlank()) return it }
        return ""
    }

    private fun resolveResendApiKey(): String {
        if (resendApiKey.isNotBlank()) return resendApiKey.trim()
        System.getenv("RESEND_API_KEY")?.trim()?.let { if (it.isNotBlank()) return it }
        System.getenv("resend_api_key")?.trim()?.let { if (it.isNotBlank()) return it }
        return ""
    }

    private fun sendGenericNotification(to: String, subject: String, plainBody: String, htmlBody: String, logLabel: String) {
        val brevoKey = resolveBrevoApiKey()
        if (brevoKey.isNotBlank()) {
            sendViaBrevoApi(to, subject, plainBody, htmlBody, logLabel, brevoKey)
            return
        }
        val resendKey = resolveResendApiKey()
        if (resendKey.isNotBlank()) {
            sendViaResendApi(to, subject, plainBody, htmlBody, logLabel, resendKey)
            return
        }
        try {
            val message = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")
            helper.setFrom(from)
            helper.setTo(to)
            helper.setSubject(subject)
            helper.setText(plainBody, htmlBody)
            mailSender.send(message)
            logger.info("Email $logLabel envoyé à $to")
        } catch (e: Exception) {
            var c: Throwable? = e.cause
            val causeChain = buildString {
                append(e.javaClass.name).append(": ").append(e.message)
                while (true) {
                    val cur = c ?: break
                    append(" | cause: ").append(cur.javaClass.name).append(": ").append(cur.message)
                    c = cur.cause
                }
            }
            logger.error("Échec envoi email [$logLabel] vers $to — $causeChain", e)
            throw e
        }
    }

    /** Envoi via l'API HTTP Brevo (port 443). Alternative simple à Resend. */
    private fun sendViaBrevoApi(to: String, subject: String, plainBody: String, htmlBody: String, logLabel: String, apiKey: String) {
        try {
            val fromAddress = if (from.isNotBlank() && from.contains("@")) from.trim() else "noreply@mikaservices.com"
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                set("api-key", apiKey)
            }
            val body = mapOf(
                "sender" to mapOf("email" to fromAddress, "name" to "MIKA Services"),
                "to" to listOf(mapOf("email" to to)),
                "subject" to subject,
                "htmlContent" to htmlBody,
                "textContent" to plainBody
            )
            val entity = HttpEntity(body, headers)
            restTemplate.postForObject("https://api.brevo.com/v3/smtp/email", entity, Map::class.java)
            logger.info("Email $logLabel envoyé à $to (Brevo API)")
        } catch (e: Exception) {
            logger.error("Échec envoi email [$logLabel] vers $to via Brevo API — ${e.message}", e)
            throw e
        }
    }

    /** Envoi via l'API HTTP Resend (port 443) lorsque SMTP est bloqué (ex. Railway). */
    private fun sendViaResendApi(to: String, subject: String, plainBody: String, htmlBody: String, logLabel: String, apiKey: String) {
        try {
            // Resend n'accepte que des adresses vérifiées ; si domaine en "Pending", utiliser l'expéditeur par défaut
            val fromAddress = if (from.isBlank() || !from.contains("@")) "onboarding@resend.dev" else from.trim()
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                setBearerAuth(apiKey)
            }
            val body = mapOf(
                "from" to fromAddress,
                "to" to listOf(to),
                "subject" to subject,
                "text" to plainBody,
                "html" to htmlBody
            )
            val entity = HttpEntity(body, headers)
            restTemplate.postForObject("https://api.resend.com/emails", entity, Map::class.java)
            logger.info("Email $logLabel envoyé à $to (Resend API)")
        } catch (e: Exception) {
            logger.error("Échec envoi email [$logLabel] vers $to via Resend API — ${e.message}", e)
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
