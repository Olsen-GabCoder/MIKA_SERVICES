package com.mikaservices.platform.common.validation

object PasswordPolicy {
    const val MIN_LENGTH = 8

    /**
     * Règles : au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
     */
    const val REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{$MIN_LENGTH,}\$"

    const val MESSAGE = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
}
