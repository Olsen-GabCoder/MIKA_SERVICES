package com.mikaservices.platform.config.mail

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

/**
 * Au démarrage, log le mode d'envoi (Resend API ou SMTP) et la config SMTP si utilisée.
 */
@Component
@Order(Int.MIN_VALUE)
class MailConfigDiagnostic(
    @Value("\${spring.mail.host:}") private val host: String,
    @Value("\${spring.mail.port:0}") private val port: Int,
    @Value("\${spring.mail.username:}") private val username: String,
    @Value("\${app.mail.resend-api-key:}") private val resendApiKeyFromProps: String,
) : ApplicationRunner {

    private val logger = LoggerFactory.getLogger(MailConfigDiagnostic::class.java)

    override fun run(args: ApplicationArguments) {
        // Diagnostic : quelles variables env le processus voit-il (noms uniquement, pas les valeurs)
        val envResend = System.getenv().keys.filter { it.uppercase().contains("RESEND") }.sorted()
        val envMail = System.getenv().keys.filter { it.uppercase().contains("MAIL") }.sorted()
        logger.info("Variables env (noms) contenant RESEND: $envResend | MAIL: $envMail")

        val resendApiKey = resolveResendApiKey(resendApiKeyFromProps)
        if (resendApiKey.isNotBlank()) {
            logger.info("Envoi emails via Resend API (RESEND_API_KEY détectée). Définir MAIL_FROM pour l'expéditeur.")
            return
        }
        val configured = host.isNotBlank() && username.isNotBlank()
        if (configured) {
            logger.info("Mail SMTP config: host=$host, port=$port, username=$username (env chargé)")
            logger.warn("RESEND_API_KEY non vue par le processus. Sur Railway: vérifier Variables du service puis Deploy (pas seulement Redeploy si variables en 'staged').")
        } else {
            logger.warn(
                "Mail SMTP non configuré (host=$host, username vide). " +
                    "Pour envoyer les emails : définir RESEND_API_KEY (recommandé sur Railway) ou MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD."
            )
        }
    }

    private fun resolveResendApiKey(fromProps: String): String {
        if (fromProps.isNotBlank()) return fromProps.trim()
        System.getenv("RESEND_API_KEY")?.trim()?.let { if (it.isNotBlank()) return it }
        System.getenv("resend_api_key")?.trim()?.let { if (it.isNotBlank()) return it }
        return ""
    }
}
