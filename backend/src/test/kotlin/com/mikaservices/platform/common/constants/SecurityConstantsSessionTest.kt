package com.mikaservices.platform.common.constants

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/**
 * Vérifie que les durées de session restent correctes.
 * Aucun code de production modifié — test de non-régression uniquement.
 */
class SecurityConstantsSessionTest {

    @Test
    fun `LONG_SESSION_MS vaut 30 jours en millisecondes`() {
        val trenteJoursMs = 30L * 24 * 60 * 60 * 1000
        assertEquals(trenteJoursMs, SecurityConstants.LONG_SESSION_MS)
    }

    @Test
    fun `SHORT_SESSION_MS vaut 1 heure en millisecondes`() {
        val uneHeureMs = 1L * 60 * 60 * 1000
        assertEquals(uneHeureMs, SecurityConstants.SHORT_SESSION_MS)
    }

    @Test
    fun `sessionExpiresIn en secondes pour 30 jours est 2592000`() {
        assertEquals(2_592_000L, SecurityConstants.LONG_SESSION_MS / 1000)
    }
}
