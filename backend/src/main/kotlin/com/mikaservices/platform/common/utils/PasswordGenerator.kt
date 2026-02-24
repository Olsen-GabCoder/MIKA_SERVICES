package com.mikaservices.platform.common.utils

import com.mikaservices.platform.common.validation.PasswordPolicy
import java.security.SecureRandom

/**
 * Génère un mot de passe aléatoire respectant la politique (8+ caractères, majuscule, minuscule, chiffre, spécial).
 */
object PasswordGenerator {

    private const val LOWERS = "abcdefghijklmnopqrstuvwxyz"
    private const val UPPERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    private const val DIGITS = "0123456789"
    private const val SPECIALS = "!@#$%&*+-=?"

    private val ALL = LOWERS + UPPERS + DIGITS + SPECIALS
    private val RANDOM = SecureRandom()

    fun generate(length: Int = PasswordPolicy.MIN_LENGTH + 4): String {
        require(length >= PasswordPolicy.MIN_LENGTH) { "Length must be at least ${PasswordPolicy.MIN_LENGTH}" }
        val chars = mutableListOf<Char>()
        chars.add(LOWERS[RANDOM.nextInt(LOWERS.length)])
        chars.add(UPPERS[RANDOM.nextInt(UPPERS.length)])
        chars.add(DIGITS[RANDOM.nextInt(DIGITS.length)])
        chars.add(SPECIALS[RANDOM.nextInt(SPECIALS.length)])
        for (i in chars.size until length) {
            chars.add(ALL[RANDOM.nextInt(ALL.length)])
        }
        return chars.shuffled(RANDOM).joinToString("")
    }
}
