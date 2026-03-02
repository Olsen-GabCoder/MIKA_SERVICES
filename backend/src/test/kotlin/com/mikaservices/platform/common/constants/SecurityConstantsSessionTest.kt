package com.mikaservices.platform.common.constants

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/**
 * Vérifie que les durées de session utilisées pour "Rester connecté 5 heures"
 * restent correctes. Aucun code de production modifié — test de non-régression uniquement.
 */
class SecurityConstantsSessionTest {

    @Test
    fun `LONG_SESSION_MS vaut 5 heures en millisecondes`() {
        val cinqHeuresMs = 5L * 60 * 60 * 1000
        assertEquals(cinqHeuresMs, SecurityConstants.LONG_SESSION_MS)
    }

    @Test
    fun `SHORT_SESSION_MS vaut 1 heure en millisecondes`() {
        val uneHeureMs = 1L * 60 * 60 * 1000
        assertEquals(uneHeureMs, SecurityConstants.SHORT_SESSION_MS)
    }

    @Test
    fun `sessionExpiresIn en secondes pour 5h est 18000`() {
        assertEquals(18_000L, SecurityConstants.LONG_SESSION_MS / 1000)
    }
}
