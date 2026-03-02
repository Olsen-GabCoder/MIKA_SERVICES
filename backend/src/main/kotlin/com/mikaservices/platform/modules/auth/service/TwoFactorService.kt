package com.mikaservices.platform.modules.auth.service

import dev.samstevens.totp.code.HashingAlgorithm
import dev.samstevens.totp.qr.QrData
import dev.samstevens.totp.qr.ZxingPngQrGenerator
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.ByteBuffer
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Service
class TwoFactorService(
    @Value("\${spring.application.name:MIKAServices}") private val appName: String
) {
    private val logger = LoggerFactory.getLogger(TwoFactorService::class.java)
    private val qrGenerator = ZxingPngQrGenerator()
    private val secureRandom = SecureRandom()

    companion object {
        private const val TOTP_PERIOD = 30L
        private const val TOTP_DIGITS = 6
        private const val TIME_TOLERANCE = 4
        private const val SECRET_BYTES = 20
        private const val BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
        private val DIGITS_POWER = intArrayOf(1, 10, 100, 1_000, 10_000, 100_000, 1_000_000)
    }

    private fun base32Encode(data: ByteArray): String {
        val sb = StringBuilder()
        var bits = 0
        var buffer = 0
        for (b in data) {
            buffer = (buffer shl 8) or (b.toInt() and 0xFF)
            bits += 8
            while (bits >= 5) {
                bits -= 5
                sb.append(BASE32_ALPHABET[(buffer shr bits) and 0x1F])
            }
        }
        if (bits > 0) {
            sb.append(BASE32_ALPHABET[(buffer shl (5 - bits)) and 0x1F])
        }
        return sb.toString()
    }

    private fun base32Decode(encoded: String): ByteArray {
        val clean = encoded.uppercase().replace("=", "").replace(" ", "")
        var bits = 0
        var buffer = 0
        val result = mutableListOf<Byte>()
        for (c in clean) {
            val value = BASE32_ALPHABET.indexOf(c)
            if (value < 0) throw IllegalArgumentException("Caractère Base32 invalide: $c")
            buffer = (buffer shl 5) or value
            bits += 5
            if (bits >= 8) {
                bits -= 8
                result.add((buffer shr bits and 0xFF).toByte())
            }
        }
        return result.toByteArray()
    }

    private fun generateBase32Secret(): String {
        val bytes = ByteArray(SECRET_BYTES)
        secureRandom.nextBytes(bytes)
        return base32Encode(bytes)
    }

    fun generateSecretAndQr(email: String): Pair<String, String> {
        val secret = generateBase32Secret()
        logger.debug("TOTP setup: secret généré pour {}", email)
        return Pair(secret, buildQrBase64(secret, email))
    }

    fun generateQrFromSecret(secret: String, email: String): Pair<String, String> {
        val cleaned = cleanSecret(secret)
        return Pair(cleaned, buildQrBase64(cleaned, email))
    }

    fun cleanSecret(secret: String): String =
        secret.trim().replace("=", "").replace(" ", "").uppercase()

    private fun buildQrBase64(secret: String, email: String): String {
        val qrData = QrData.Builder()
            .label(email)
            .secret(secret)
            .issuer(appName)
            .algorithm(HashingAlgorithm.SHA1)
            .digits(TOTP_DIGITS)
            .period(TOTP_PERIOD.toInt())
            .build()
        val imageData = qrGenerator.generate(qrData)
        return Base64.getEncoder().encodeToString(imageData)
    }

    private fun generateTotpCode(secretBase32: String, counter: Long): String {
        val key = base32Decode(secretBase32)
        val counterBytes = ByteBuffer.allocate(8).putLong(counter).array()

        val mac = Mac.getInstance("HmacSHA1")
        mac.init(SecretKeySpec(key, "HmacSHA1"))
        val hash = mac.doFinal(counterBytes)

        val offset = hash[hash.size - 1].toInt() and 0x0F
        val binary = ((hash[offset].toInt() and 0x7F) shl 24) or
                ((hash[offset + 1].toInt() and 0xFF) shl 16) or
                ((hash[offset + 2].toInt() and 0xFF) shl 8) or
                (hash[offset + 3].toInt() and 0xFF)

        val otp = binary % DIGITS_POWER[TOTP_DIGITS]
        return otp.toString().padStart(TOTP_DIGITS, '0')
    }

    fun verifyCode(secret: String, code: String): Boolean {
        val digitsOnly = code.filter { it.isDigit() }
        if (digitsOnly.length < 6) return false

        val normalized = digitsOnly.take(6)
        val cleanedSecret = cleanSecret(secret)

        try {
            base32Decode(cleanedSecret)
        } catch (e: Exception) {
            logger.error("TOTP verify: décodage Base32 échoué: {}", e.message)
            return false
        }

        val currentBucket = (System.currentTimeMillis() / 1000) / TOTP_PERIOD

        for (offset in -TIME_TOLERANCE..TIME_TOLERANCE) {
            try {
                if (generateTotpCode(cleanedSecret, currentBucket + offset) == normalized) {
                    logger.info("TOTP verify: succès pour code={}", normalized)
                    return true
                }
            } catch (e: Exception) {
                logger.error("TOTP verify: erreur offset={}: {}", offset, e.message)
            }
        }

        logger.warn("TOTP verify: échec pour code={}", normalized)
        return false
    }

    fun getCurrentCode(secret: String): String {
        val cleanedSecret = cleanSecret(secret)
        val currentBucket = (System.currentTimeMillis() / 1000) / TOTP_PERIOD
        return generateTotpCode(cleanedSecret, currentBucket)
    }
}
