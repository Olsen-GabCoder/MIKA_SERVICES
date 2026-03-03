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
) : ApplicationRunner {

    private val logger = LoggerFactory.getLogger(MailConfigDiagnostic::class.java)

    override fun run(args: ApplicationArguments) {
        val resendApiKey = System.getenv("RESEND_API_KEY")?.trim().orEmpty()
        if (resendApiKey.isNotBlank()) {
            logger.info("Envoi emails via Resend API (RESEND_API_KEY définie). Définir MAIL_FROM pour l'expéditeur.")
            return
        }
        val configured = host.isNotBlank() && username.isNotBlank()
        if (configured) {
            logger.info("Mail SMTP config: host=$host, port=$port, username=$username (env chargé)")
            logger.warn("Sur Railway, les ports SMTP (587/465) sont souvent bloqués. Définir RESEND_API_KEY pour utiliser l'API Resend (port 443).")
        } else {
            logger.warn(
                "Mail SMTP non configuré (host=$host, username vide). " +
                    "Pour envoyer les emails : définir RESEND_API_KEY (recommandé sur Railway) ou MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD dans .env."
            )
        }
    }
}
