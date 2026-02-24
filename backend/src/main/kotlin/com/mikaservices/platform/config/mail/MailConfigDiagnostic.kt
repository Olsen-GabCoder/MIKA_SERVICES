package com.mikaservices.platform.config.mail

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

/**
 * Au démarrage, log la configuration SMTP lue (sans mot de passe) pour vérifier
 * que le .env est bien chargé (ex. MAIL_HOST doit être smtp.gmail.com, pas localhost).
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
        val configured = host.isNotBlank() && username.isNotBlank()
        if (configured) {
            logger.info("Mail SMTP config: host=$host, port=$port, username=$username (env chargé)")
        } else {
            logger.warn(
                "Mail SMTP non configuré (host=$host, username vide). " +
                    "Vérifiez que le fichier backend/.env existe et contient MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD. " +
                    "L'email de bienvenue ne pourra pas être envoyé."
            )
        }
    }
}
