package com.mikaservices.platform.config.mail

import com.mikaservices.platform.common.enums.Sexe
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
import java.math.BigDecimal
import java.util.concurrent.ConcurrentHashMap

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    private val restTemplate: RestTemplate,
    @Value("\${app.mail.from:noreply@mikaservices.com}") private val from: String,
    @Value("\${app.mail.brevo-api-key:}") private val brevoApiKey: String,
    @Value("\${app.mail.resend-api-key:}") private val resendApiKey: String,
    @Value("\${app.mail.frontend-base-url:}") private val frontendBaseUrl: String
) {
    private val logger = LoggerFactory.getLogger(EmailService::class.java)

    private val appBaseUrl: String get() = frontendBaseUrl.trimEnd('/').ifBlank {
        logger.warn("FRONTEND_BASE_URL non configuré — les liens dans les emails seront invalides. Définir cette variable sur Render.")
        ""
    }

    private val logoUrl: String get() = "$appBaseUrl/Logo_mika_services.png"

    private fun link(path: String): String = "$appBaseUrl$path"

    // ─── Cooldown anti-spam ───────────────────────────────────────
    private val emailCooldowns = ConcurrentHashMap<String, Long>()
    private val COOLDOWN_LOGIN_MS = 10 * 60 * 1000L
    private val COOLDOWN_DEFAULT_MS = 2 * 60 * 1000L

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
        <p style="margin:24px 0;text-align:center;">
          <a href="$url" style="background:#FF6B35;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;">$text</a>
        </p>
    """.trimIndent()

    private fun wrapHtml(content: String): String {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0;">
            <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:28px 32px;color:#333;font-size:14px;line-height:1.7;">
                $content
              </td></tr>
              <tr><td style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
                <img src="$logoUrl" alt="MIKA Services" style="max-width:120px;height:auto;margin-bottom:8px;" />
                <p style="margin:0;color:#999;font-size:11px;">L'&eacute;quipe MIKA Services &mdash; <a href="$appBaseUrl" style="color:#FF6B35;text-decoration:none;">Acc&eacute;der &agrave; la plateforme</a></p>
              </td></tr>
            </table>
            </td></tr>
            </table>
            </body>
            </html>
        """.trimIndent()
    }

    private fun salut(sexe: Sexe?, name: String): String = when (sexe) {
        Sexe.HOMME -> "Bonjour Monsieur $name"
        Sexe.FEMME -> "Bonjour Madame $name"
        null       -> "Bonjour $name"
    }

    // ─── Emails ───────────────────────────────────────────────────

    fun sendWelcomeEmail(to: String, prenom: String, temporaryPassword: String, sexe: Sexe? = null) {
        val loginLink = link("/login")
        val profileLink = link("/profile")
        val greeting = salut(sexe, prenom)
        val subject = "Bienvenue sur MIKA Services, $prenom"
        val plainBody = """
            $greeting,

            Votre compte MIKA Services a été créé.

            Email : $to
            Mot de passe temporaire : $temporaryPassword

            Connexion : $loginLink

            Vous devrez modifier ce mot de passe lors de votre première connexion.
            Nous recommandons d'activer la 2FA depuis votre profil : $profileLink

            Si vous n'êtes pas à l'origine de cette création de compte, contactez votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>Votre compte MIKA Services a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s. Voici vos identifiants :</p>
            <table cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-left:3px solid #FF6B35;padding:12px 16px;margin:16px 0;width:100%;">
              <tr><td style="padding:8px 16px;font-size:14px;">
                <strong>Email :</strong> ${htmlEscape(to)}<br>
                <strong>Mot de passe :</strong> <code style="background:#eef2f5;padding:2px 6px;border-radius:3px;">${htmlEscape(temporaryPassword)}</code>
              </td></tr>
            </table>
            ${buttonHtml("Se connecter", loginLink)}
            <p style="font-size:13px;color:#666;">Pour des raisons de s&eacute;curit&eacute;, vous devrez <strong>modifier ce mot de passe</strong> lors de votre premi&egrave;re connexion.</p>
            <p style="font-size:13px;color:#666;">Nous recommandons d'activer l'authentification &agrave; deux facteurs (2FA) depuis votre <a href="$profileLink" style="color:#FF6B35;">profil</a>.</p>
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "bienvenue")
    }

    fun sendPasswordResetEmail(to: String, prenom: String, token: String, sexe: Sexe? = null) {
        val resetLink = link("/reset-password?token=$token")
        val greeting = salut(sexe, prenom)
        val subject = "MIKA Services — R\u00e9initialisation de mot de passe"
        val plainBody = """
            $greeting,

            Vous avez demandé la réinitialisation de votre mot de passe.

            Lien : $resetLink (valide 1 heure)

            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>Vous avez demand&eacute; la r&eacute;initialisation de votre mot de passe MIKA Services.</p>
            ${buttonHtml("D\u00e9finir un nouveau mot de passe", resetLink)}
            <p style="font-size:13px;color:#666;">Ce lien est valide pendant <strong>1 heure</strong>. Pass&eacute; ce d&eacute;lai, vous devrez refaire une demande.</p>
            <p style="font-size:13px;color:#999;">Si vous n'&ecirc;tes pas &agrave; l'origine de cette demande, ignorez simplement cet email.</p>
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "reset mot de passe")
    }

    fun sendLoginNotification(to: String, fullName: String, ip: String?, userAgent: String?, sexe: Sexe? = null) {
        if (isInCooldown(to, "login")) {
            logger.debug("Notification login en cooldown pour $to, ignorée")
            return
        }
        val subject = "MIKA Services — Connexion depuis un nouvel appareil"
        val ipInfo = ip?.takeIf { it.isNotBlank() } ?: "non disponible"
        val uaInfo = userAgent?.takeIf { it.isNotBlank() }?.take(200) ?: "non disponible"
        val deviceName = parseUserAgentShort(uaInfo)

        val greeting = salut(sexe, fullName)
        val plainBody = """
            $greeting,

            Une connexion à votre compte a été détectée depuis un nouvel appareil.

            Appareil : $deviceName
            Adresse IP : $ipInfo

            Si c'est vous, aucune action requise.
            Sinon, changez immédiatement votre mot de passe et contactez votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>Une connexion &agrave; votre compte a &eacute;t&eacute; d&eacute;tect&eacute;e depuis un appareil non reconnu :</p>
            <table cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-left:3px solid #2E5266;padding:12px 16px;margin:16px 0;width:100%;">
              <tr><td style="padding:8px 16px;font-size:14px;">
                <strong>Appareil :</strong> ${htmlEscape(deviceName)}<br>
                <strong>Adresse IP :</strong> ${htmlEscape(ipInfo)}
              </td></tr>
            </table>
            <p style="font-size:14px;color:#333;"><strong>C'est vous ?</strong> Aucune action requise.</p>
            <p style="font-size:14px;color:#c0392b;"><strong>Ce n'est pas vous ?</strong> Changez imm&eacute;diatement votre mot de passe :</p>
            ${buttonHtml("Modifier mon mot de passe", link("/profile"))}
        """.trimIndent())

        sendGenericNotification(to, subject, plainBody, htmlBody, "login")
        markSent(to, "login")
    }

    fun sendPasswordChangedNotification(to: String, fullName: String, sexe: Sexe? = null) {
        if (isInCooldown(to, "password-changed")) return
        val greeting = salut(sexe, fullName)
        val subject = "MIKA Services — Mot de passe modifi\u00e9"
        val plainBody = """
            $greeting,

            Le mot de passe de votre compte MIKA Services a été modifié avec succès.

            Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>Le mot de passe de votre compte MIKA Services a &eacute;t&eacute; modifi&eacute; avec succ&egrave;s.</p>
            <p style="font-size:13px;color:#c0392b;">Si vous n'&ecirc;tes pas &agrave; l'origine de cette modification, contactez imm&eacute;diatement votre administrateur.</p>
        """.trimIndent())

        sendGenericNotification(to, subject, plainBody, htmlBody, "password changed")
        markSent(to, "password-changed")
    }

    fun send2FAEnabledNotification(to: String, fullName: String, sexe: Sexe? = null) {
        val greeting = salut(sexe, fullName)
        val subject = "MIKA Services — 2FA activ\u00e9e"
        val plainBody = """
            $greeting,

            L'authentification à deux facteurs (2FA) a été activée sur votre compte.
            Un code à usage unique sera demandé à chaque connexion.

            Si vous n'avez pas effectué cette modification, contactez votre administrateur.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>L'authentification &agrave; deux facteurs (2FA) a &eacute;t&eacute; <strong>activ&eacute;e</strong> sur votre compte MIKA Services.</p>
            <p style="font-size:13px;color:#666;">Un code &agrave; usage unique sera d&eacute;sormais demand&eacute; &agrave; chaque connexion.</p>
            <p style="font-size:13px;color:#999;">Si vous n'avez pas effectu&eacute; cette modification, contactez votre administrateur.</p>
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "2FA enabled")
    }

    fun send2FADisabledNotification(to: String, fullName: String, sexe: Sexe? = null) {
        val greeting = salut(sexe, fullName)
        val subject = "MIKA Services — 2FA d\u00e9sactiv\u00e9e"
        val plainBody = """
            $greeting,

            L'authentification à deux facteurs (2FA) a été désactivée sur votre compte.

            Si vous n'avez pas effectué cette modification, contactez votre administrateur et réactivez la 2FA.

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>L'authentification &agrave; deux facteurs (2FA) a &eacute;t&eacute; <strong>d&eacute;sactiv&eacute;e</strong> sur votre compte MIKA Services.</p>
            <p style="font-size:13px;color:#c0392b;">Si vous n'avez pas effectu&eacute; cette modification, contactez votre administrateur et r&eacute;activez la 2FA.</p>
            ${buttonHtml("Acc\u00e9der \u00e0 mon profil", link("/profile"))}
        """.trimIndent())
        sendGenericNotification(to, subject, plainBody, htmlBody, "2FA disabled")
    }

    fun sendInAppNotificationEmail(to: String, prenom: String, titre: String, contenu: String?, lien: String?) {
        if (isInCooldown(to, "notification")) {
            logger.debug("Email notification en cooldown pour $to, ignoré")
            return
        }
        val effectiveLink = lien?.takeIf { it.isNotBlank() } ?: link("/notifications")
        val subject = "MIKA Services — ${titre.take(60)}${if (titre.length > 60) "\u2026" else ""}"
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
            <p style="background:#f8f9fa;border-left:3px solid #FF6B35;padding:12px 16px;margin:16px 0;font-size:14px;">
              <strong>${htmlEscape(titre.take(200))}</strong>
              ${if (contenu?.isNotBlank() == true) "<br><span style=\"color:#666;\">${htmlEscape(contenu.take(300))}</span>" else ""}
            </p>
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

            Nouveau message de $expediteurNom.
            Sujet : $sujetSafe
            ${contenuExtrait?.take(200) ?: ""}

            Consulter : $messagerieLink

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            <p>Vous avez re&ccedil;u un nouveau message de <strong>${htmlEscape(expediteurNom)}</strong> :</p>
            <p style="background:#f8f9fa;border-left:3px solid #2E5266;padding:12px 16px;margin:16px 0;font-size:14px;">
              <strong>Sujet :</strong> ${htmlEscape(sujetSafe.take(200))}
              ${if (contenuExtrait?.isNotBlank() == true) "<br><br><em style=\"color:#666;\">&laquo; ${htmlEscape(contenuExtrait.take(200))}${if (contenuExtrait.length > 200) "\u2026" else ""} &raquo;</em>" else ""}
            </p>
            ${buttonHtml("Ouvrir la messagerie", messagerieLink)}
        """.trimIndent())
        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "nouveau message")
            markSent(to, "message")
        } catch (e: Exception) {
            logger.warn("Envoi email nouveau message échoué vers $to: ${e.message}")
        }
    }

    /**
     * Rapport quotidien de l'état de la plateforme — envoyé chaque jour à 09h00 à tous les utilisateurs actifs.
     * Contient : résumé global, projets actifs avec avancement, points bloquants ouverts par projet.
     */
    fun sendPlatformStatusEmail(
        to: String,
        prenom: String,
        sexe: Sexe? = null,
        data: PlatformStatusEmailData
    ) {
        if (data.totalProjets == 0) return
        val greeting = salut(sexe, prenom)
        val plateformeLink = link("/projets")
        val dateFormatee = data.date.let {
            val jour = when (it.dayOfWeek.value) {
                1 -> "lundi"; 2 -> "mardi"; 3 -> "mercredi"; 4 -> "jeudi"
                5 -> "vendredi"; 6 -> "samedi"; else -> "dimanche"
            }
            "$jour ${it.dayOfMonth} ${when (it.monthValue) {
                1->"janvier"; 2->"février"; 3->"mars"; 4->"avril"; 5->"mai"; 6->"juin"
                7->"juillet"; 8->"août"; 9->"septembre"; 10->"octobre"; 11->"novembre"; else->"décembre"
            }} ${it.year}"
        }

        val subject = "MIKA Services — Tableau de bord du $dateFormatee"

        // ── Plain text ──────────────────────────────────────────────
        val plainBody = buildString {
            appendLine(greeting)
            appendLine()
            appendLine("TABLEAU DE BORD — $dateFormatee".uppercase())
            appendLine("${"─".repeat(50)}")
            appendLine("Projets actifs : ${data.totalProjets}")
            appendLine("Points bloquants ouverts : ${data.totalPointsBloquants} (dont ${data.totalPointsCritiques} critique(s)/urgent(s))")
            appendLine()

            fun appendSection(titre: String, projets: List<ProjetEmailRow>) {
                if (projets.isEmpty()) return
                appendLine("$titre (${projets.size})")
                appendLine("${"─".repeat(40)}")
                projets.forEach { p ->
                    val phys = p.avancementPhysique?.let { "${it.toInt()}%" } ?: "—"
                    val fin  = p.avancementFinancier?.let { "${it.toInt()}%" } ?: "—"
                    appendLine("• ${p.nom}")
                    appendLine("  Responsable : ${p.responsableNom ?: "Non assigné"}")
                    appendLine("  Avancement  : $phys physique | $fin financier")
                    if (p.pointsBloquants.isEmpty()) {
                        appendLine("  Aucun point bloquant ouvert")
                    } else {
                        p.pointsBloquants.forEach { pb ->
                            appendLine("  ⚠ ${pb.titre} — ${pb.priorite} — depuis le ${pb.dateDetection}")
                        }
                    }
                    appendLine()
                }
            }

            appendSection("PROJETS EN COURS", data.projetsEnCours)
            appendSection("PROJETS PLANIFIÉS", data.projetsPlanifies)
            appendSection("PROJETS EN RÉCEPTION PROVISOIRE", data.projetsReceptionProvisoire)
            appendLine("— L'équipe MIKA Services")
            appendLine(plateformeLink)
        }

        // ── HTML ────────────────────────────────────────────────────
        fun prioriteBadge(p: com.mikaservices.platform.common.enums.Priorite): String {
            val (bg, fg, label) = when (p) {
                com.mikaservices.platform.common.enums.Priorite.CRITIQUE -> Triple("#b91c1c", "#fff", "CRITIQUE")
                com.mikaservices.platform.common.enums.Priorite.URGENTE  -> Triple("#c2410c", "#fff", "URGENTE")
                com.mikaservices.platform.common.enums.Priorite.HAUTE    -> Triple("#d97706", "#fff", "HAUTE")
                com.mikaservices.platform.common.enums.Priorite.NORMALE  -> Triple("#6b7280", "#fff", "NORMALE")
                com.mikaservices.platform.common.enums.Priorite.BASSE    -> Triple("#9ca3af", "#fff", "BASSE")
            }
            return """<span style="background:$bg;color:$fg;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;letter-spacing:.5px;">$label</span>"""
        }

        fun avancementBar(pct: BigDecimal?, color: String): String {
            val v = pct?.toInt()?.coerceIn(0, 100) ?: 0
            return """<div style="background:#e5e7eb;border-radius:4px;height:6px;width:100%;margin:2px 0;">
              <div style="background:$color;width:$v%;height:6px;border-radius:4px;"></div>
            </div>"""
        }

        fun sectionHtml(titre: String, couleurBadge: String, projets: List<ProjetEmailRow>): String {
            if (projets.isEmpty()) return ""
            val rows = projets.joinToString("") { p ->
                val phys = p.avancementPhysique?.toInt() ?: 0
                val fin  = p.avancementFinancier?.toInt() ?: 0
                val projetLink = link("/projets/${p.id}")
                val pbHtml = if (p.pointsBloquants.isEmpty()) {
                    """<p style="margin:6px 0 0;font-size:12px;color:#16a34a;">✓ Aucun point bloquant ouvert</p>"""
                } else {
                    p.pointsBloquants.joinToString("") { pb ->
                        """<p style="margin:4px 0 0;font-size:12px;color:#374151;">
                            ⚠&nbsp;${htmlEscape(pb.titre)}&nbsp;&nbsp;${prioriteBadge(pb.priorite)}&nbsp;
                            <span style="color:#9ca3af;font-size:11px;">depuis le ${pb.dateDetection}</span>
                           </p>"""
                    }
                }
                """
                <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td><a href="$projetLink" style="font-weight:700;color:#1e3a5f;text-decoration:none;font-size:14px;">${htmlEscape(p.nom)}</a></td>
                      <td style="text-align:right;white-space:nowrap;">
                        <a href="$projetLink" style="font-size:11px;color:#FF6B35;text-decoration:none;">Voir →</a>
                      </td>
                    </tr>
                    <tr><td colspan="2" style="font-size:12px;color:#6b7280;padding-top:2px;">
                      Responsable : ${htmlEscape(p.responsableNom ?: "Non assigné")}
                    </td></tr>
                    <tr><td colspan="2" style="padding-top:6px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="48%" style="font-size:11px;color:#6b7280;">Physique : <strong>$phys%</strong></td>
                          <td width="4%"></td>
                          <td width="48%" style="font-size:11px;color:#6b7280;">Financier : <strong>$fin%</strong></td>
                        </tr>
                        <tr>
                          <td>${avancementBar(p.avancementPhysique, "#2E5266")}</td>
                          <td></td>
                          <td>${avancementBar(p.avancementFinancier, "#FF6B35")}</td>
                        </tr>
                      </table>
                    </td></tr>
                    <tr><td colspan="2">$pbHtml</td></tr>
                  </table>
                </td></tr>"""
            }
            return """
            <p style="margin:20px 0 6px;font-weight:700;font-size:13px;color:#1e3a5f;text-transform:uppercase;letter-spacing:.5px;">
              <span style="display:inline-block;width:10px;height:10px;background:$couleurBadge;border-radius:50%;margin-right:6px;"></span>
              $titre&nbsp;&nbsp;<span style="font-weight:400;color:#6b7280;">(${projets.size})</span>
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">$rows</table>"""
        }

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p style="margin:4px 0 16px;color:#6b7280;font-size:13px;">Tableau de bord MIKA Services &mdash; <strong>$dateFormatee</strong></p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:3px solid #2E5266;border-radius:4px;margin:0 0 8px;">
              <tr>
                <td style="padding:12px 16px;font-size:13px;">
                  <strong style="color:#1e3a5f;">${data.totalProjets}</strong> projet(s) actif(s)
                  &nbsp;|&nbsp;
                  <strong style="color:#374151;">${data.totalPointsBloquants}</strong> point(s) bloquant(s) ouvert(s)
                  ${if (data.totalPointsCritiques > 0) "&nbsp;|&nbsp;<strong style=\"color:#b91c1c;\">${data.totalPointsCritiques} critique(s)/urgent(s)</strong>" else ""}
                </td>
              </tr>
            </table>

            ${sectionHtml("Projets en cours", "#16a34a", data.projetsEnCours)}
            ${sectionHtml("Projets planifiés", "#2563eb", data.projetsPlanifies)}
            ${sectionHtml("Réception provisoire", "#d97706", data.projetsReceptionProvisoire)}

            ${buttonHtml("Acc&eacute;der &agrave; la plateforme", plateformeLink)}
        """.trimIndent())

        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "rapport plateforme quotidien")
        } catch (e: Exception) {
            logger.warn("Envoi rapport plateforme échoué vers $to: ${e.message}")
        }
    }

    /**
     * Rappel hebdomadaire envoyé aux chefs de projet pour mettre à jour leurs projets
     * avant la réunion du vendredi.
     *
     * @param projets liste de paires (nomProjet, idProjet) à mettre à jour
     * @param jourReunion ex. "vendredi" ou "demain (vendredi)"
     */
    fun sendRappelMajProjetEmail(
        to: String,
        prenom: String,
        projets: List<Pair<String, Long>>,
        jourReunion: String,
        sexe: Sexe? = null
    ) {
        if (projets.isEmpty()) return
        val greeting = salut(sexe, prenom)
        val projetsLink = link("/projets")
        val subject = "MIKA Services — Rappel : mise à jour de vos projets avant la réunion"
        val projectCount = projets.size

        val plainProjetList = projets.joinToString("\n") { (nom, id) ->
            "  • $nom — ${link("/projets/$id")}"
        }
        val plainBody = """
            $greeting,

            La réunion hebdomadaire a lieu $jourReunion. Merci de mettre à jour vos projets avant cette date.

            Vous avez $projectCount projet(s) à actualiser :
            $plainProjetList

            Pensez à renseigner :
              - L'avancement physique (%)
              - L'avancement financier (%)
              - Les points bloquants éventuels
              - Les besoins en matériel et en personnel

            Accéder à mes projets : $projetsLink

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlProjetRows = projets.joinToString("") { (nom, id) ->
            val projetLink = link("/projets/$id")
            """<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">
                <a href="$projetLink" style="color:#2E5266;font-weight:600;text-decoration:none;">${htmlEscape(nom)}</a>
               </td>
               <td style="padding:6px 0 6px 12px;border-bottom:1px solid #eee;text-align:right;">
                <a href="$projetLink" style="color:#FF6B35;font-size:12px;text-decoration:none;">Mettre à jour →</a>
               </td></tr>"""
        }

        val htmlBody = wrapHtml("""
            <p>${htmlEscape(greeting)},</p>
            <p>La <strong>r&eacute;union hebdomadaire</strong> a lieu <strong>${htmlEscape(jourReunion)}</strong>.<br>
               Merci de mettre &agrave; jour vos projets avant cette &eacute;ch&eacute;ance.</p>
            <p style="margin:16px 0 8px;font-weight:600;color:#333;">Vos projets &agrave; actualiser ($projectCount) :</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
              $htmlProjetRows
            </table>
            <p style="margin:16px 0 6px;font-size:13px;color:#555;">Pour chaque projet, pensez &agrave; renseigner :</p>
            <ul style="padding-left:20px;color:#555;font-size:13px;margin:0 0 16px;">
              <li>L'avancement physique (%)</li>
              <li>L'avancement financier (%)</li>
              <li>Les points bloquants &eacute;ventuels</li>
              <li>Les besoins en mat&eacute;riel et en personnel</li>
            </ul>
            ${buttonHtml("Acc&eacute;der &agrave; mes projets", projetsLink)}
        """.trimIndent())

        try {
            sendGenericNotification(to, subject, plainBody, htmlBody, "rappel MAJ projet")
        } catch (e: Exception) {
            logger.warn("Envoi rappel MAJ projet échoué vers $to: ${e.message}")
        }
    }

    fun sendDailyDigestEmail(to: String, prenom: String, unreadNotificationsCount: Long, unreadMessagesCount: Long) {
        if (unreadNotificationsCount == 0L && unreadMessagesCount == 0L) return
        val appLink = link("/notifications")
        val messagerieLink = link("/messagerie")
        val subject = "MIKA Services — R\u00e9sum\u00e9 du jour"
        val plainBody = """
            Bonjour $prenom,

            Résumé MIKA Services :
            • Notifications non lues : $unreadNotificationsCount
            • Messages non lus : $unreadMessagesCount

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            <p>Voici votre r&eacute;sum&eacute; MIKA Services pour aujourd'hui :</p>
            <ul style="padding-left:20px;color:#333;">
              <li><strong>$unreadNotificationsCount</strong> notification(s) non lue(s)</li>
              <li><strong>$unreadMessagesCount</strong> message(s) non lu(s)</li>
            </ul>
            <p style="text-align:center;margin:20px 0;">
              <a href="$appLink" style="color:#2E5266;font-weight:600;text-decoration:none;margin-right:16px;">Notifications</a>
              <a href="$messagerieLink" style="color:#FF6B35;font-weight:600;text-decoration:none;">Messagerie</a>
            </p>
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
        val subject = "MIKA Services — R\u00e9sum\u00e9 de la semaine"
        val plainBody = """
            Bonjour $prenom,

            Résumé hebdomadaire MIKA Services :
            • Notifications non lues : $unreadNotificationsCount
            • Messages non lus : $unreadMessagesCount

            — L'équipe MIKA Services
        """.trimIndent()

        val htmlBody = wrapHtml("""
            <p>Bonjour <strong>${htmlEscape(prenom)}</strong>,</p>
            <p>Voici votre r&eacute;sum&eacute; hebdomadaire MIKA Services :</p>
            <ul style="padding-left:20px;color:#333;">
              <li><strong>$unreadNotificationsCount</strong> notification(s) non lue(s)</li>
              <li><strong>$unreadMessagesCount</strong> message(s) non lu(s)</li>
            </ul>
            <p style="text-align:center;margin:20px 0;">
              <a href="$appLink" style="color:#2E5266;font-weight:600;text-decoration:none;margin-right:16px;">Notifications</a>
              <a href="$messagerieLink" style="color:#FF6B35;font-weight:600;text-decoration:none;">Messagerie</a>
            </p>
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
    fun sendWelcomeEmailAsync(to: String, prenom: String, temporaryPassword: String, sexe: Sexe? = null) {
        try { sendWelcomeEmail(to, prenom, temporaryPassword, sexe) } catch (e: Exception) {
            logger.error("Échec envoi email bienvenue (async) à $to: ${e.message}", e)
        }
    }

    @Async
    fun sendLoginNotificationAsync(to: String, fullName: String, ip: String?, userAgent: String?, sexe: Sexe? = null) {
        try { sendLoginNotification(to, fullName, ip, userAgent, sexe) } catch (e: Exception) {
            logger.warn("Envoi notification login (async) échoué vers $to: ${e.message}")
        }
    }
}
