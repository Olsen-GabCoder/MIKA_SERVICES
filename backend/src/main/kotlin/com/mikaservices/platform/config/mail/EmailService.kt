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
import java.util.concurrent.ConcurrentHashMap

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    private val restTemplate: RestTemplate,
    @Value("\${app.mail.from:noreply@mikaservices.com}") private val from: String,
    @Value("\${app.mail.brevo-api-key:}") private val brevoApiKey: String,
    @Value("\${app.mail.resend-api-key:}") private val resendApiKey: String,
    @Value("\${app.mail.frontend-base-url:http://localhost:5173}") private val frontendBaseUrl: String
) {
    private val logger = LoggerFactory.getLogger(EmailService::class.java)

    private val appBaseUrl: String get() = frontendBaseUrl.trimEnd('/')

    private fun link(path: String): String = "$appBaseUrl$path"

    // ─── Cooldown anti-spam ───────────────────────────────────────
    private val emailCooldowns = ConcurrentHashMap<String, Long>()
    private val COOLDOWN_LOGIN_MS = 10 * 60 * 1000L  // 10 min entre 2 notifs login
    private val COOLDOWN_DEFAULT_MS = 2 * 60 * 1000L  // 2 min par défaut

    private fun isInCooldown(to: String, type: String): Boolean {
        val key = "$to:$type"
        val lastSent = emailCooldowns[key] ?: return false
        val cooldown = if (type == "login") COOLDOWN_LOGIN_MS else COOLDOWN_DEFAULT_MS
        return System.currentTimeMillis() - lastSent < cooldown
    }

    private fun markSent(to: String, type: String) {
        emailCooldowns["$to:$type"] = System.currentTimeMillis()
        if (emailCooldowns.size > 5000) {
            val cutoff = System.currentTimeMillis() - 30 * 60 * 1000L
            emailCooldowns.entries.removeIf { it.value < cutoff }
        }
    }

    // ─── Helpers HTML ─────────────────────────────────────────────
    private fun htmlEscape(s: String): String = s
        .replace("&", "&amp;").replace("<", "&lt;")
        .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;")

    private fun buttonHtml(text: String, url: String): String = """
        <div style="text-align:center;margin:28px 0;">
          <a href="$url" style="display:inline-block;background:#FF6B35;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.3px;box-shadow:0 2px 8px rgba(255,107,53,0.3);">$text</a>
        </div>
    """.trimIndent()

    private fun infoBox(content: String): String = """
        <div style="background:#f8f9fa;border-left:4px solid #FF6B35;border-radius:6px;padding:16px 20px;margin:20px 0;font-size:14px;color:#333;">
          $content
        </div>
    """.trimIndent()

    private fun warningBox(content: String): String = """
        <div style="background:#fff8f0;border-left:4px solid #F0C15A;border-radius:6px;padding:16px 20px;margin:20px 0;font-size:13px;color:#8B6914;">
          ⚠️ $content
        </div>
    """.trimIndent()

    private fun wrapHtml(content: String): String {
        val logoUrl = "$appBaseUrl/Logo_mika_services.png"
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
            <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr><td style="background:linear-gradient(135deg,#2E5266 0%,#1a3a4d 100%);padding:32px 40px;text-align:center;">
                <img src="$logoUrl" alt="MIKA Services" style="max-width:180px;height:auto;" />
              </td></tr>
              <tr><td style="padding:36px 40px 28px;color:#333;font-size:15px;line-height:1.75;">
                $content
              </td></tr>
              <tr><td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e9ecef;">
                <p style="margin:0 0 4px;color:#2E5266;font-weight:700;font-size:13px;">L'équipe MIKA Services</p>
                <p style="margin:0;color:#999;font-size:11px;">
                  <a href="$appBaseUrl" style="color:#FF6B35;text-decoration:none;">Accéder à la plateforme</a>
                </p>
              </td></tr>
            </table>
            <p style="text-align:center;color:#999;font-size:10px;margin-top:16px;">
              Cet email a été envoyé automatiquement par MIKA Services. Merci de ne pas y répondre.
            </p>
            </td></tr>
            </table>
            </body>
            </html>
        """.trimIndent()
    }

    // ─── Emails ───────────────────────────────────────────────────

    fun sendWelcomeEmail(to: String, prenom: String, temporaryPassword: String) {
        val loginLink = link("/login")
        val profileLink = link("/profile")
        val subject = "Bienvenue sur MIKA Services, $prenom — Vos identifiants"
        val plainBody = """
            Bonjour $prenom,

            Votre compte MIKA Services a été créé avec succès.

            Email : $to
            Mot de passe temporaire : $temporaryPassword

            Connexion : $loginLink

            Vous devrez modifier ce mot de passe lors de votre première connexion.
            Nous recommandons d'activer l'authentification à deux facteurs (2FA) depuis votre profil : $profileLink

            Si vous n'êtes pas à l'origine de cette création de compte, contactez immédiatement votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">Bienvenue, ${htmlEscape(prenom)} 👋</h2>
            <p style="color:#666;margin:0 0 24px;">Votre compte MIKA Services a été créé avec succès. Voici vos identifiants de connexion :</p>
            ${infoBox("""
                <strong style="color:#2E5266;">Email :</strong> ${htmlEscape(to)}<br>
                <strong style="color:#2E5266;">Mot de passe temporaire :</strong> <code style="background:#e8f4f8;padding:2px 8px;border-radius:4px;font-size:14px;">${htmlEscape(temporaryPassword)}</code>
            """)}
            ${buttonHtml("Se connecter", loginLink)}
            ${warningBox("Pour des raisons de sécurité, vous devrez <strong>modifier ce mot de passe</strong> lors de votre première connexion.")}
            <p style="font-size:13px;color:#666;">
              Nous vous recommandons d'<strong>activer l'authentification à deux facteurs (2FA)</strong> depuis votre
              <a href="$profileLink" style="color:#FF6B35;">profil</a> après connexion.
            </p>
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "bienvenue")
    }

    fun sendPasswordResetEmail(to: String, prenom: String, token: String) {
        val resetLink = link("/reset-password?token=$token")
        val subject = "MIKA Services — Réinitialisation de votre mot de passe"
        val plainBody = """
            Bonjour $prenom,

            Vous avez demandé une réinitialisation de votre mot de passe MIKA Services.

            Lien : $resetLink (valide 1 heure)

            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">Réinitialisation du mot de passe</h2>
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous pour en définir un nouveau :</p>
            ${buttonHtml("Nouveau mot de passe", resetLink)}
            ${warningBox("Ce lien est valide pendant <strong>1 heure</strong>. Passé ce délai, vous devrez refaire une demande.")}
            <p style="font-size:13px;color:#999;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "reset mot de passe")
    }

    fun sendLoginNotification(to: String, fullName: String, ip: String?, userAgent: String?) {
        if (isInCooldown(to, "login")) {
            logger.debug("Notification login en cooldown pour $to, ignorée")
            return
        }
        val subject = "MIKA Services — Connexion depuis un nouvel appareil"
        val ipInfo = ip?.takeIf { it.isNotBlank() } ?: "non disponible"
        val uaInfo = userAgent?.takeIf { it.isNotBlank() }?.take(200) ?: "non disponible"
        val deviceName = parseUserAgentShort(uaInfo)

        val plainBody = """
            Bonjour $fullName,

            Une connexion à votre compte a été détectée depuis un nouvel appareil.

            Appareil : $deviceName
            Adresse IP : $ipInfo

            Si vous êtes à l'origine de cette connexion, aucune action n'est requise.
            Sinon, changez immédiatement votre mot de passe et contactez votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">Nouvel appareil détecté 🔐</h2>
            <p>Bonjour <strong>${htmlEscape(fullName)}</strong>,</p>
            <p>Une connexion à votre compte a été enregistrée depuis un appareil que nous n'avons pas reconnu :</p>
            ${infoBox("""
                <strong>📱 Appareil :</strong> ${htmlEscape(deviceName)}<br>
                <strong>🌐 Adresse IP :</strong> ${htmlEscape(ipInfo)}
            """)}
            <p style="font-size:14px;color:#333;">✅ <strong>C'est vous ?</strong> Aucune action requise.</p>
            <p style="font-size:14px;color:#E63946;">❌ <strong>Ce n'est pas vous ?</strong> Changez immédiatement votre mot de passe :</p>
            ${buttonHtml("Modifier mon mot de passe", link("/profile"))}
        """.trimIndent())

        sendGenericNotification(to, subject, plainBody, htmlBody, "login")
        markSent(to, "login")
    }

    fun sendPasswordChangedNotification(to: String, fullName: String) {
        if (isInCooldown(to, "password-changed")) return
        val subject = "MIKA Services — Votre mot de passe a été modifié"
        val plainBody = """
            Bonjour $fullName,

            Le mot de passe de votre compte MIKA Services a été modifié avec succès.

            Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">Mot de passe modifié ✓</h2>
            <p>Bonjour <strong>${htmlEscape(fullName)}</strong>,</p>
            <p>Le mot de passe de votre compte a été modifié avec succès.</p>
            ${warningBox("Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.")}
        """.trimIndent())

        sendGenericNotification(to, subject, plainBody, htmlBody, "password changed")
        markSent(to, "password-changed")
    }

    fun send2FAEnabledNotification(to: String, fullName: String) {
        val subject = "MIKA Services — Authentification 2FA activée"
        val plainBody = """
            Bonjour $fullName,

            L'authentification à deux facteurs (2FA) a été activée sur votre compte.
            Un code à usage unique sera demandé à chaque connexion.

            Si vous n'avez pas effectué cette modification, contactez votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">2FA activée 🛡️</h2>
            <p>Bonjour <strong>${htmlEscape(fullName)}</strong>,</p>
            <p>L'authentification à deux facteurs a été <strong>activée</strong> sur votre compte MIKA Services.</p>
            ${infoBox("Un code à usage unique sera désormais demandé à chaque connexion pour renforcer la sécurité de votre compte.")}
            <p style="font-size:13px;color:#999;">Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur.</p>
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "2FA enabled")
    }

    fun send2FADisabledNotification(to: String, fullName: String) {
        val subject = "MIKA Services — Authentification 2FA désactivée"
        val plainBody = """
            Bonjour $fullName,

            L'authentification à deux facteurs (2FA) a été désactivée sur votre compte.

            Si vous n'avez pas effectué cette modification, contactez votre administrateur et réactivez la 2FA.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">2FA désactivée ⚠️</h2>
            <p>Bonjour <strong>${htmlEscape(fullName)}</strong>,</p>
            <p>L'authentification à deux facteurs a été <strong>désactivée</strong> sur votre compte MIKA Services.</p>
            ${warningBox("Votre compte est maintenant moins protégé. Si vous n'avez pas effectué cette modification, contactez immédiatement votre administrateur et réactivez la 2FA.")}
            ${buttonHtml("Accéder à mon profil", link("/profile"))}
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "2FA disabled")
    }

    fun sendInAppNotificationEmail(to: String, prenom: String, titre: String, contenu: String?, lien: String?) {
        if (isInCooldown(to, "notification")) {
            logger.debug("Email notification en cooldown pour $to, ignoré")
            return
        }
        val effectiveLink = lien?.takeIf { it.isNotBlank() } ?: link("/notifications")
        val subject = "MIKA Services — ${titre.take(60)}${if (titre.length > 60) "…" else ""}"
        val plainBody = """
            Bonjour $prenom,

            Nouvelle notification : $titre
            ${contenu?.take(300) ?: ""}

            Consulter : $effectiveLink

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            <p>Vous avez une nouvelle notification :</p>
            ${infoBox("<strong>${htmlEscape(titre.take(200))}</strong>${if (contenu?.isNotBlank() == true) "<br><span style=\"color:#666;\">${htmlEscape(contenu.take(300))}</span>" else ""}")}
            ${buttonHtml("Voir la notification", effectiveLink)}
        """.trimIndent())
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "notification in-app")
            markSent(to, "notification")
        } catch (e: Exception) {
            logger.warn("Envoi email notification in-app échoué vers $to: ${e.message}")
        }
    }

    fun sendNewMessageEmail(to: String, prenom: String, expediteurNom: String, sujet: String?, contenuExtrait: String? = null) {
        if (isInCooldown(to, "message")) {
            logger.debug("Email message en cooldown pour $to, ignoré")
            return
        }
        val sujetSafe = sujet.orEmpty()
        val messagerieLink = link("/messagerie")
        val subject = "MIKA Services — Message de ${expediteurNom.take(30)}"
        val plainBody = """
            Bonjour $prenom,

            Nouveau message de $expediteurNom :
            Sujet : $sujetSafe
            ${contenuExtrait?.take(200) ?: ""}

            Consulter : $messagerieLink

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            <p>Vous avez reçu un nouveau message de <strong>${htmlEscape(expediteurNom)}</strong> :</p>
            ${infoBox("""
                <strong>Sujet :</strong> ${htmlEscape(sujetSafe.take(200))}
                ${if (contenuExtrait?.isNotBlank() == true) "<br><br><span style=\"color:#666;font-style:italic;\">\"${htmlEscape(contenuExtrait.take(200))}${if (contenuExtrait.length > 200) "…" else ""}\"</span>" else ""}
            """)}
            ${buttonHtml("Ouvrir la messagerie", messagerieLink)}
        """.trimIndent())
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "nouveau message")
            markSent(to, "message")
        } catch (e: Exception) {
            logger.warn("Envoi email nouveau message échoué vers $to: ${e.message}")
        }
    }

    fun sendDailyDigestEmail(to: String, prenom: String, unreadNotificationsCount: Long, unreadMessagesCount: Long) {
        if (unreadNotificationsCount == 0L && unreadMessagesCount == 0L) return
        val appLink = link("/notifications")
        val messagerieLink = link("/messagerie")
        val subject = "MIKA Services — Résumé du jour"
        val plainBody = """
            Bonjour $prenom,

            Résumé MIKA Services :
            • Notifications non lues : $unreadNotificationsCount
            • Messages non lus : $unreadMessagesCount

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">Votre résumé du jour 📊</h2>
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            ${infoBox("""
                📬 <strong>$unreadNotificationsCount</strong> notification(s) non lue(s)<br>
                💬 <strong>$unreadMessagesCount</strong> message(s) non lu(s)
            """)}
            <div style="text-align:center;margin:24px 0;">
              <a href="$appLink" style="display:inline-block;background:#2E5266;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:0 6px;">Notifications</a>
              <a href="$messagerieLink" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:0 6px;">Messagerie</a>
            </div>
        """.trimIndent())
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "digest quotidien")
        } catch (e: Exception) {
            logger.warn("Envoi digest quotidien échoué vers $to: ${e.message}")
        }
    }

    fun sendWeeklyDigestEmail(to: String, prenom: String, unreadNotificationsCount: Long, unreadMessagesCount: Long) {
        if (unreadNotificationsCount == 0L && unreadMessagesCount == 0L) return
        val appLink = link("/notifications")
        val messagerieLink = link("/messagerie")
        val subject = "MIKA Services — Résumé de la semaine"
        val plainBody = """
            Bonjour $prenom,

            Résumé hebdomadaire MIKA Services :
            • Notifications non lues : $unreadNotificationsCount
            • Messages non lus : $unreadMessagesCount

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <h2 style="color:#2E5266;margin:0 0 8px;font-size:22px;">Votre résumé de la semaine 📊</h2>
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            ${infoBox("""
                📬 <strong>$unreadNotificationsCount</strong> notification(s) non lue(s)<br>
                💬 <strong>$unreadMessagesCount</strong> message(s) non lu(s)
            """)}
            <div style="text-align:center;margin:24px 0;">
              <a href="$appLink" style="display:inline-block;background:#2E5266;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:0 6px;">Notifications</a>
              <a href="$messagerieLink" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:0 6px;">Messagerie</a>
            </div>
        """.trimIndent())
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "digest hebdo")
        } catch (e: Exception) {
            logger.warn("Envoi digest hebdo échoué vers $to: ${e.message}")
        }
    }

    // ─── Helpers user-agent ───────────────────────────────────────

    private fun parseUserAgentShort(ua: String): String {
        val uaLower = ua.lowercase()
        val browser = when {
            uaLower.contains("edg/") || uaLower.contains("edge/") -> "Edge"
            uaLower.contains("opr/") || uaLower.contains("opera") -> "Opera"
            uaLower.contains("chrome") && !uaLower.contains("edg") -> "Chrome"
            uaLower.contains("firefox") -> "Firefox"
            uaLower.contains("safari") && !uaLower.contains("chrome") -> "Safari"
            else -> "Navigateur"
        }
        val os = when {
            uaLower.contains("iphone") -> "iPhone"
            uaLower.contains("ipad") -> "iPad"
            uaLower.contains("android") -> "Android"
            uaLower.contains("windows") -> "Windows"
            uaLower.contains("macintosh") || uaLower.contains("mac os") -> "Mac"
            uaLower.contains("linux") -> "Linux"
            else -> "Appareil"
        }
        return "$browser sur $os"
    }

    // ─── Transport ────────────────────────────────────────────────

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
                while (true) { val cur = c ?: break; append(" | cause: ").append(cur.javaClass.name).append(": ").append(cur.message); c = cur.cause }
            }
            logger.error("Échec envoi email [$logLabel] vers $to — $causeChain", e)
            throw e
        }
    }

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
            restTemplate.postForObject("https://api.brevo.com/v3/smtp/email", HttpEntity(body, headers), Map::class.java)
            logger.info("Email $logLabel envoyé à $to (Brevo API)")
        } catch (e: Exception) {
            logger.error("Échec envoi email [$logLabel] vers $to via Brevo API — ${e.message}", e)
            throw e
        }
    }

    private fun sendViaResendApi(to: String, subject: String, plainBody: String, htmlBody: String, logLabel: String, apiKey: String) {
        try {
            val fromAddress = if (from.isBlank() || !from.contains("@")) "onboarding@resend.dev" else from.trim()
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                setBearerAuth(apiKey)
            }
            val body = mapOf("from" to fromAddress, "to" to listOf(to), "subject" to subject, "text" to plainBody, "html" to htmlBody)
            restTemplate.postForObject("https://api.resend.com/emails", HttpEntity(body, headers), Map::class.java)
            logger.info("Email $logLabel envoyé à $to (Resend API)")
        } catch (e: Exception) {
            logger.error("Échec envoi email [$logLabel] vers $to via Resend API — ${e.message}", e)
            throw e
        }
    }

    @Async
    fun sendWelcomeEmailAsync(to: String, prenom: String, temporaryPassword: String) {
        try { sendWelcomeEmail(to, prenom, temporaryPassword) } catch (e: Exception) {
            logger.error("Échec envoi email bienvenue (async) à $to: ${e.message}", e)
        }
    }

    @Async
    fun sendLoginNotificationAsync(to: String, fullName: String, ip: String?, userAgent: String?) {
        try { sendLoginNotification(to, fullName, ip, userAgent) } catch (e: Exception) {
            logger.warn("Envoi notification login (async) échoué vers $to: ${e.message}")
        }
    }
}
