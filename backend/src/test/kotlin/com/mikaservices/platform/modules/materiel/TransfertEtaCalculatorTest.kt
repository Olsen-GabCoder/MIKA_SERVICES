package com.mikaservices.platform.modules.materiel

import com.mikaservices.platform.modules.materiel.service.TransfertEtaCalculator
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

/**
 * Verrouille le calcul d'ETA d'un transfert (Haversine + vitesse).
 */
class TransfertEtaCalculatorTest {

    @Test
    fun `haversine - distance nulle entre deux points identiques`() {
        val d = TransfertEtaCalculator.haversineKm(0.4, 9.4, 0.4, 9.4)
        assertEquals(0.0, d, 0.0001)
    }

    @Test
    fun `haversine - distance connue Libreville vers Port-Gentil approx 140 km`() {
        // Libreville (0.39, 9.45) -> Port-Gentil (-0.72, 8.78)
        val d = TransfertEtaCalculator.haversineKm(0.39, 9.45, -0.72, 8.78)
        assertTrue(d in 130.0..160.0, "distance attendue ~145 km, obtenu $d")
    }

    @Test
    fun `eta - null si coordonnees destination absentes`() {
        assertNull(TransfertEtaCalculator.etaMinutes(0.4, 9.4, null, 9.5, listOf(50.0)))
        assertNull(TransfertEtaCalculator.etaMinutes(0.4, 9.4, 0.5, null, listOf(50.0)))
    }

    @Test
    fun `eta - utilise la vitesse relevee quand disponible`() {
        // ~11.1 km vers le nord, a 60 km/h => ~11 min
        val eta = TransfertEtaCalculator.etaMinutes(0.0, 9.4, 0.1, 9.4, listOf(60.0, 62.0, 58.0))
        assertNotNull(eta)
        assertTrue(eta!! in 10..13, "ETA attendu ~11 min, obtenu $eta")
    }

    @Test
    fun `eta - repli 40 km h quand aucune vitesse exploitable`() {
        // Vitesses a l'arret (<=5 km/h) ignorees => repli 40 km/h
        val etaRepli = TransfertEtaCalculator.etaMinutes(0.0, 9.4, 0.1, 9.4, listOf(0.0, 2.0))
        val etaVide = TransfertEtaCalculator.etaMinutes(0.0, 9.4, 0.1, 9.4, emptyList())
        assertEquals(etaVide, etaRepli)
        // ~11.1 km a 40 km/h => ~17 min
        assertTrue(etaRepli!! in 16..18, "ETA repli attendu ~17 min, obtenu $etaRepli")
    }

    @Test
    fun `eta - jamais negatif ni au-dela de 24h`() {
        val eta = TransfertEtaCalculator.etaMinutes(0.0, 0.0, 40.0, 40.0, emptyList())
        assertNotNull(eta)
        assertTrue(eta!! in 0..1440)
    }
}
