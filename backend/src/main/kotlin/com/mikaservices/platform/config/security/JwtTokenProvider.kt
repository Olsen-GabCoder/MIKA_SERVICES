package com.mikaservices.platform.config.security

import com.mikaservices.platform.common.constants.SecurityConstants
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import javax.crypto.SecretKey
import java.util.*

@Component
class JwtTokenProvider(
    @Value("\${app.jwt.secret:}")
    private val secretKey: String
) {
    
    private val key: SecretKey by lazy {
        val secret = secretKey.ifBlank { 
            throw IllegalStateException("JWT_SECRET environment variable or app.jwt.secret property is required")
        }
        // Le secret doit faire au moins 256 bits (32 caractères) pour HS256
        if (secret.length < 32) {
            throw IllegalArgumentException("JWT secret must be at least 32 characters long")
        }
        Keys.hmacShaKeyFor(secret.toByteArray())
    }
    
    fun generateToken(username: String, roles: List<String>, expirationMs: Long = 900000L): String {
        val now = Date()
        val expiryDate = Date(now.time + expirationMs)
        
        return Jwts.builder()
            .setSubject(username)
            .claim("roles", roles)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key)
            .compact()
    }
    
    fun generateRefreshToken(username: String): String {
        val now = Date()
        val expiryDate = Date(now.time + SecurityConstants.DEFAULT_REFRESH_TOKEN_EXPIRATION_MS)
        
        return Jwts.builder()
            .setSubject(username)
            .claim("type", "refresh")
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key)
            .compact()
    }

    /** Token temporaire pour login en attente de vérification 2FA (5 min). */
    fun generate2FAPendingToken(email: String): String {
        val now = Date()
        val expiryDate = Date(now.time + 5 * 60 * 1000)
        return Jwts.builder()
            .setSubject(email)
            .claim("type", "2fa-pending")
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key)
            .compact()
    }

    fun validate2FAPendingToken(token: String): String? {
        return try {
            val claims = getClaimsFromToken(token)
            if (claims["type"] == "2fa-pending" && !claims.expiration.before(Date())) {
                claims.subject
            } else null
        } catch (e: Exception) {
            null
        }
    }
    
    fun getUsernameFromToken(token: String): String {
        val claims = getClaimsFromToken(token)
        return claims.subject
    }
    
    fun getRolesFromToken(token: String): List<String> {
        val claims = getClaimsFromToken(token)
        @Suppress("UNCHECKED_CAST")
        return (claims["roles"] as? List<*>)?.map { it.toString() } ?: emptyList()
    }
    
    fun validateToken(token: String): Boolean {
        return try {
            val claims = getClaimsFromToken(token)
            !claims.expiration.before(Date())
        } catch (e: Exception) {
            false
        }
    }
    
    private fun getClaimsFromToken(token: String): Claims {
        val parser = Jwts.parser()
            .verifyWith(key)
            .build()
        return parser.parseSignedClaims(token).payload
    }
}
