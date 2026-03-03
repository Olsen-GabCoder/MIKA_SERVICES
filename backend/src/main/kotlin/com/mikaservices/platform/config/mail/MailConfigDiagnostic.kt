package com.mikaservices.platform.config.mail

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.env.Environment
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

/**
 * Au démarrage, log le mode d'envoi (Brevo/Resend API ou SMTP) et avertit si en prod les liens emails pointent vers localhost.
 */
@Component
@Order(Int.MIN_VALUE)
class MailConfigDiagnostic(
    private val environment: Environment,
    @Value("\${spring.mail.host:}") private val host: String,
    @Value("\${spring.mail.port:0}") private val port: Int,
    @Value("\${spring.mail.username:}") private val username: String,
    @Value("\${app.mail.frontend-base-url:}") private val frontendBaseUrl: String,
    @Value("\${app.mail.brevo-api-key:}") private val brevoApiKeyFromProps: String,
    @Value("\${app.mail.resend-api-key:}") private val resendApiKeyFromProps: String,
) : ApplicationRunner {

    private val logger = LoggerFactory.getLogger(MailConfigDiagnostic::class.java)

    override fun run(args: ApplicationArguments) {
        if (environment.activeProfiles.contains("prod") && (frontendBaseUrl.trim().isBlank() || frontendBaseUrl.trim().lowercase().contains("localhost"))) {
            logger.warn("En production, définir FRONTEND_BASE_URL (URL du frontend, ex. https://mika-services.up.railway.app) sur Railway pour que les liens dans les emails pointent vers le site et non localhost.")
        }
        val envBrevo = System.getenv().keys.filter { it.uppercase().contains("BREVO") }.sorted()
        val envResend = System.getenv().keys.filter { it.uppercase().contains("RESEND") }.sorted()
        val envMail = System.getenv().keys.filter { it.uppercase().contains("MAIL") }.sorted()
        logger.info("Variables env (noms) BREVO: $envBrevo | RESEND: $envResend | MAIL: $envMail")

        val brevoKey = resolveBrevoApiKey(brevoApiKeyFromProps)
        if (brevoKey.isNotBlank()) {
            logger.info("Envoi emails via Brevo API (BREVO_API_KEY détectée). Définir MAIL_FROM pour l'expéditeur.")
            return
        }
        val resendKey = resolveResendApiKey(resendApiKeyFromProps)
        if (resendKey.isNotBlank()) {
            logger.info("Envoi emails via Resend API (RESEND_API_KEY détectée). Définir MAIL_FROM pour l'expéditeur.")
            return
        }
        val configured = host.isNotBlank() && username.isNotBlank()
        if (configured) {
            logger.info("Mail SMTP config: host=$host, port=$port, username=$username (env chargé)")
            logger.warn("Aucune clé API (Brevo/Resend) vue. Sur Railway: définir BREVO_API_KEY ou RESEND_API_KEY pour éviter timeout SMTP.")
        } else {
            logger.warn(
                "Mail non configuré. Définir BREVO_API_KEY (recommandé), ou RESEND_API_KEY, ou MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD."
            )
        }
    }

    private fun resolveBrevoApiKey(fromProps: String): String {
        if (fromProps.isNotBlank()) return fromProps.trim()
        System.getenv("BREVO_API_KEY")?.trim()?.let { if (it.isNotBlank()) return it }
        System.getenv("brevo_api_key")?.trim()?.let { if (it.isNotBlank()) return it }
        return ""
    }

    private fun resolveResendApiKey(fromProps: String): String {
        if (fromProps.isNotBlank()) return fromProps.trim()
        System.getenv("RESEND_API_KEY")?.trim()?.let { if (it.isNotBlank()) return it }
        System.getenv("resend_api_key")?.trim()?.let { if (it.isNotBlank()) return it }
        return ""
    }
}
