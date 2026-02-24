package com.mikaservices.platform.modules.auth.service

import dev.samstevens.totp.code.DefaultCodeGenerator
import dev.samstevens.totp.code.DefaultCodeVerifier
import dev.samstevens.totp.code.HashingAlgorithm
import dev.samstevens.totp.qr.QrData
import dev.samstevens.totp.qr.ZxingPngQrGenerator
import dev.samstevens.totp.secret.DefaultSecretGenerator
import dev.samstevens.totp.time.SystemTimeProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Base64

@Service
class TwoFactorService(
    @Value("\${spring.application.name:MIKA Services}") private val appName: String
) {
    private val secretGenerator = DefaultSecretGenerator(32)
    private val qrGenerator = ZxingPngQrGenerator()
    private val codeVerifier = run {
        val verifier = DefaultCodeVerifier(
            DefaultCodeGenerator(HashingAlgorithm.SHA1),
            SystemTimeProvider()
        )
        verifier.setAllowedTimePeriodDiscrepancy(2) // ±2 périodes (60 s) pour décalage horaire
        verifier
    }

    /** Génère un secret TOTP et une image QR en base64. Retourne Pair(secret, qrImageBase64). */
    fun generateSecretAndQr(email: String): Pair<String, String> {
        val secret = secretGenerator.generate()
        return Pair(secret, buildQrBase64(secret, email))
    }

    /** Régénère uniquement l'image QR à partir d'un secret existant (pour réafficher le même QR). */
    fun generateQrFromSecret(secret: String, email: String): Pair<String, String> {
        return Pair(secret, buildQrBase64(secret.trim(), email))
    }

    private fun buildQrBase64(secret: String, email: String): String {
        val qrData = QrData.Builder()
            .label(email)
            .secret(secret)
            .issuer(appName)
            .algorithm(HashingAlgorithm.SHA1)
            .digits(6)
            .period(30)
            .build()
        val imageData = qrGenerator.generate(qrData)
        return Base64.getEncoder().encodeToString(imageData)
    }

    /** Vérifie le code TOTP contre le secret. Le code est normalisé (chiffres seuls, 6 caractères, padding zéro à gauche). */
    fun verifyCode(secret: String, code: String): Boolean {
        return try {
            val digitsOnly = code.filter { it.isDigit() }
            if (digitsOnly.isEmpty()) return false
            val normalized = digitsOnly.take(6).padStart(6, '0')
            val secretTrimmed = secret.trim()
            codeVerifier.isValidCode(secretTrimmed, normalized)
        } catch (e: Exception) {
            false
        }
    }
}
