package com.mikaservices.platform.modules.materiel.service

/**
 * Calcul de l'ETA (temps estime d'arrivee) d'un transfert d'engin.
 * Objet pur (sans dependance Spring) pour rester testable unitairement.
 */
object TransfertEtaCalculator {

    private const val EARTH_RADIUS_KM = 6371.0

    /** Vitesse de repli quand aucun releve GPS recent n'est exploitable (route mixte chantier). */
    const val VITESSE_REPLI_KMH = 40.0

    /** Distance orthodromique (Haversine) en km entre deux points GPS. */
    fun haversineKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val sinLat = Math.sin(dLat / 2)
        val sinLon = Math.sin(dLon / 2)
        val a = sinLat * sinLat +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * sinLon * sinLon
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1.0, Math.sqrt(a)))
    }

    /**
     * ETA en minutes jusqu'a la destination.
     * @param vitessesRecentesKmh vitesses relevees dans le dernier lot GPS (nulls tolerees en amont).
     * @return null si les coordonnees destination sont absentes ; sinon minutes bornees [0, 1440].
     */
    fun etaMinutes(
        currentLat: Double,
        currentLon: Double,
        destLat: Double?,
        destLon: Double?,
        vitessesRecentesKmh: List<Double>,
    ): Int? {
        val dLat = destLat ?: return null
        val dLon = destLon ?: return null
        val distanceKm = haversineKm(currentLat, currentLon, dLat, dLon)
        val enMouvement = vitessesRecentesKmh.filter { it > 5.0 }
        val vitesseKmh = if (enMouvement.isNotEmpty()) enMouvement.average() else VITESSE_REPLI_KMH
        val minutes = (distanceKm / vitesseKmh) * 60.0
        return Math.ceil(minutes).toInt().coerceIn(0, 24 * 60)
    }
}
