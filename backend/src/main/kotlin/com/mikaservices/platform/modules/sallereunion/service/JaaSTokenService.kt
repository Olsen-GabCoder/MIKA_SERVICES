package com.mikaservices.platform.modules.sallereunion.service

import com.mikaservices.platform.modules.user.entity.User
import io.jsonwebtoken.Jwts
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.io.File
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.spec.PKCS8EncodedKeySpec
import java.util.Base64
import java.util.Date

/**
 * Genere des JWT RS256 pour JaaS (Jitsi as a Service, 8x8.vc).
 * Le token permet a un utilisateur MIKA de rejoindre la salle Jitsi
 * sans authentification externe (Google/GitHub).
 */
@Service
class JaaSTokenService(
    @Value("\${app.jaas.app-id:}") private val appId: String,
    @Value("\${app.jaas.kid:}") private val kid: String,
    @Value("\${app.jaas.private-key-path:}") private val privateKeyPath: String,
    @Value("\${app.jaas.token-validity-hours:2}") private val tokenValidityHours: Long,
    @Value("\${app.jaas.enabled:false}") private val enabled: Boolean,
) {
    private val logger = LoggerFactory.getLogger(JaaSTokenService::class.java)

    private val privateKey: PrivateKey by lazy {
        logger.info("Chargement de la cle privee JaaS depuis: $privateKeyPath")
        loadPrivateKey(privateKeyPath)
    }

    fun isEnabled(): Boolean = enabled && appId.isNotBlank() && kid.isNotBlank() && privateKeyPath.isNotBlank()

    fun getAppId(): String = appId

    /**
     * Genere un JWT JaaS pour un utilisateur MIKA.
     *
     * @param user L'utilisateur MIKA authentifie
     * @param isModerator true si l'user a le role ADMIN/SUPER_ADMIN (devient moderateur Jitsi)
     * @param roomName Le nom de la salle
     * @return JWT signe RS256 pret a passer a JaaS
     */
    fun generateToken(user: User, isModerator: Boolean, roomName: String): String {
        val now = Date()
        val expiry = Date(now.time + tokenValidityHours * 3_600_000)

        val userContext = mapOf(
            "id" to (user.id?.toString() ?: ""),
            "name" to "${user.prenom} ${user.nom}",
            "email" to user.email,
            "moderator" to isModerator.toString(),
            "avatar" to "",
        )
        val featuresContext = mapOf(
            "livestreaming" to "false",
            "recording" to "false",
            "transcription" to "false",
            "outbound-call" to "false",
        )
        val context = mapOf(
            "user" to userContext,
            "features" to featuresContext,
        )

        val token = Jwts.builder()
            .header()
                .keyId(kid)
                .type("JWT")
                .and()
            .claim("aud", "jitsi")
            .claim("iss", "chat")
            .claim("sub", appId)
            .claim("room", roomName)
            .claim("context", context)
            .issuedAt(now)
            .notBefore(now)
            .expiration(expiry)
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact()

        logger.debug("JWT JaaS genere pour userId=${user.id} moderator=$isModerator room=$roomName")
        return token
    }

    private fun loadPrivateKey(path: String): PrivateKey {
        val file = File(path)
        if (!file.exists()) {
            throw IllegalStateException("Fichier cle privee JaaS introuvable: $path")
        }
        val keyContent = file.readText()
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("-----BEGIN RSA PRIVATE KEY-----", "")
            .replace("-----END RSA PRIVATE KEY-----", "")
            .replace("\\s".toRegex(), "")

        val keyBytes = Base64.getDecoder().decode(keyContent)
        val keySpec = PKCS8EncodedKeySpec(keyBytes)
        val keyFactory = KeyFactory.getInstance("RSA")
        return keyFactory.generatePrivate(keySpec)
    }
}
