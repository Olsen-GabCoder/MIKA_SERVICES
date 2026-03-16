package com.mikaservices.platform.config.database

import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import javax.sql.DataSource

/**
 * DataSource pour la prod PostgreSQL (Render).
 * Parse DATABASE_URL au format Render : postgresql://user:password@host:port/dbname
 * ou utilise jdbc:postgresql:// avec DATABASE_USERNAME / DATABASE_PASSWORD.
 */
@Configuration
@Profile("prod-postgres")
class ProdPostgresDataSourceConfig(
    private val env: Environment,
    @Value("\${HIKARI_MAX_POOL:15}") private val maxPoolSize: Int,
    @Value("\${HIKARI_MIN_IDLE:5}") private val minIdle: Int,
) {

    @Bean
    fun dataSource(): DataSource {
        val rawUrl = env.getProperty("DATABASE_URL") ?: throw IllegalStateException(
            "prod-postgres: DATABASE_URL doit être défini (format postgresql:// ou jdbc:postgresql://)"
        )
        val (url, user, pwd) = parseDatabaseUrl(rawUrl)
        return HikariDataSource().apply {
            jdbcUrl = url
            username = user
            password = pwd
            maximumPoolSize = maxPoolSize
            minimumIdle = minIdle
            connectionTimeout = 20_000
            idleTimeout = 300_000
            maxLifetime = 1_200_000
            driverClassName = "org.postgresql.Driver"
        }
    }

    /**
     * Parse DATABASE_URL : postgresql://user:pass@host:port/db -> (jdbcUrl, user, pass)
     * ou retourne (url, username, password) si déjà en jdbc:postgresql://.
     */
    private fun parseDatabaseUrl(raw: String): Triple<String, String, String> {
        val trimmed = raw.trim()
        return when {
            trimmed.startsWith("jdbc:postgresql://") -> Triple(
                trimmed,
                env.getProperty("DATABASE_USERNAME") ?: "",
                env.getProperty("DATABASE_PASSWORD") ?: ""
            )
            trimmed.startsWith("postgresql://") -> parsePostgresqlUrl(trimmed)
            else -> throw IllegalArgumentException(
                "DATABASE_URL doit commencer par postgresql:// ou jdbc:postgresql:// (reçu: ${trimmed.take(20)}...)"
            )
        }
    }

    private fun parsePostgresqlUrl(url: String): Triple<String, String, String> {
        // postgresql://user:password@host:port/database
        val withoutScheme = url.removePrefix("postgresql://")
        val atIndex = withoutScheme.lastIndexOf('@')
        if (atIndex < 0) throw IllegalArgumentException("DATABASE_URL postgresql:// invalide: pas de @")
        val userInfo = withoutScheme.substring(0, atIndex)
        val hostPart = withoutScheme.substring(atIndex + 1)
        val firstColon = userInfo.indexOf(':')
        val username = if (firstColon < 0) userInfo else userInfo.substring(0, firstColon)
        val password = if (firstColon < 0) "" else userInfo.substring(firstColon + 1)
        val jdbcUrl = "jdbc:postgresql://$hostPart"
        return Triple(jdbcUrl, username, password)
    }
}
