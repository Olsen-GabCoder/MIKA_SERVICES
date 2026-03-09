package com.mikaservices.platform.modules.meteo.service

import com.mikaservices.platform.modules.meteo.dto.response.ConditionTravail
import com.mikaservices.platform.modules.meteo.dto.response.MeteoResponse
import com.mikaservices.platform.modules.meteo.dto.response.PrevisionJour
import com.mikaservices.platform.modules.meteo.dto.response.PrevisionResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class MeteoService {
    private val logger = LoggerFactory.getLogger(MeteoService::class.java)
    private val restTemplate = RestTemplate()

    @Value("\${app.meteo.api-key:}")
    private var apiKey: String = ""

    @Value("\${app.meteo.default-city:Libreville}")
    private var defaultCity: String = "Libreville"

    fun getMeteoActuelle(ville: String?): MeteoResponse {
        val city = ville ?: defaultCity

        if (apiKey.isBlank()) {
            return getMeteoSimulee(city)
        }

        return try {
            val url = "https://api.openweathermap.org/data/2.5/weather?q=$city&appid=$apiKey&units=metric&lang=fr"
            val response = restTemplate.getForObject(url, Map::class.java)
            parseMeteoResponse(city, response)
        } catch (e: Exception) {
            logger.warn("Erreur API météo pour $city: ${e.message}. Utilisation données simulées.")
            getMeteoSimulee(city)
        }
    }

    fun getPrevisions(ville: String?): PrevisionResponse {
        val city = ville ?: defaultCity

        if (apiKey.isBlank()) {
            return getPrevisionsSimulees(city)
        }

        return try {
            val url = "https://api.openweathermap.org/data/2.5/forecast?q=$city&appid=$apiKey&units=metric&lang=fr&cnt=40"
            val response = restTemplate.getForObject(url, Map::class.java)
            parsePrevisionResponse(city, response)
        } catch (e: Exception) {
            logger.warn("Erreur API prévisions pour $city: ${e.message}. Utilisation données simulées.")
            getPrevisionsSimulees(city)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseMeteoResponse(ville: String, data: Map<*, *>?): MeteoResponse {
        if (data == null) return getMeteoSimulee(ville)

        val main = data["main"] as? Map<String, Any> ?: return getMeteoSimulee(ville)
        val weather = (data["weather"] as? List<Map<String, Any>>)?.firstOrNull() ?: return getMeteoSimulee(ville)
        val wind = data["wind"] as? Map<String, Any> ?: emptyMap()
        val clouds = data["clouds"] as? Map<String, Any> ?: emptyMap()

        val temp = (main["temp"] as? Number)?.toDouble() ?: 0.0
        val humidity = (main["humidity"] as? Number)?.toInt() ?: 0
        val windSpeedMs = (wind["speed"] as? Number)?.toDouble() ?: 0.0
        val windSpeedKmh = windSpeedMs * 3.6
        val description = weather["description"] as? String ?: ""

        return MeteoResponse(
            ville = ville,
            temperature = temp,
            temperatureRessentie = (main["feels_like"] as? Number)?.toDouble() ?: temp,
            humidite = humidity,
            description = description,
            icone = weather["icon"] as? String ?: "01d",
            vitesseVent = windSpeedKmh,
            directionVent = (wind["deg"] as? Number)?.toInt() ?: 0,
            pression = (main["pressure"] as? Number)?.toInt() ?: 0,
            visibilite = (data["visibility"] as? Number)?.toInt() ?: 10000,
            nuages = (clouds["all"] as? Number)?.toInt() ?: 0,
            conditionTravail = evaluerConditionTravail(temp, windSpeedKmh, humidity, description)
        )
    }

    @Suppress("UNCHECKED_CAST")
    private fun parsePrevisionResponse(ville: String, data: Map<*, *>?): PrevisionResponse {
        if (data == null) return getPrevisionsSimulees(ville)

        val list = data["list"] as? List<Map<String, Any>> ?: return getPrevisionsSimulees(ville)
        val previsions = list.chunked(8).take(5).map { dayItems ->
            val first = dayItems.first()
            val main = first["main"] as? Map<String, Any> ?: emptyMap()
            val weather = (first["weather"] as? List<Map<String, Any>>)?.firstOrNull() ?: emptyMap()
            val wind = first["wind"] as? Map<String, Any> ?: emptyMap()
            val windMs = (wind["speed"] as? Number)?.toDouble() ?: 0.0

            val temps = dayItems.mapNotNull { (it["main"] as? Map<String, Any>)?.get("temp") as? Number }.map { it.toDouble() }
            PrevisionJour(
                date = (first["dt_txt"] as? String)?.take(10) ?: "",
                temperatureMin = temps.minOrNull() ?: 0.0,
                temperatureMax = temps.maxOrNull() ?: 0.0,
                description = weather["description"] as? String ?: "",
                icone = weather["icon"] as? String ?: "01d",
                probPluie = (first["pop"] as? Number)?.toDouble() ?: 0.0,
                vitesseVent = windMs * 3.6
            )
        }

        return PrevisionResponse(ville = ville, previsions = previsions)
    }

    private fun evaluerConditionTravail(temp: Double, ventKmh: Double, humidite: Int, description: String): ConditionTravail {
        val alertes = mutableListOf<String>()
        var favorable = true

        if (temp > 40) { alertes.add("Température extrême (${temp}°C) — risque insolation"); favorable = false }
        else if (temp > 35) alertes.add("Forte chaleur — hydratation obligatoire")

        if (ventKmh > 60) { alertes.add("Vents violents (${ventKmh.toInt()} km/h) — travaux en hauteur interdits"); favorable = false }
        else if (ventKmh > 40) alertes.add("Vent fort — vigilance travaux en hauteur")

        val descLower = description.lowercase()
        if (descLower.contains("orage") || descLower.contains("tempête")) { alertes.add("Orage/tempête — arrêt des travaux extérieurs"); favorable = false }
        if (descLower.contains("forte pluie") || descLower.contains("pluie torrentielle")) { alertes.add("Fortes pluies — sols glissants"); favorable = false }
        if (descLower.contains("pluie")) alertes.add("Pluie — protection des matériaux")

        if (humidite > 90) alertes.add("Humidité très élevée — attention aux glissades")

        val message = when {
            !favorable -> "Conditions défavorables pour les travaux"
            alertes.isNotEmpty() -> "Conditions acceptables avec précautions"
            else -> "Conditions favorables pour les travaux"
        }

        return ConditionTravail(favorable = favorable, message = message, alertes = alertes)
    }

    private fun getMeteoSimulee(ville: String): MeteoResponse {
        return MeteoResponse(
            ville = ville, temperature = 28.0, temperatureRessentie = 31.0,
            humidite = 75, description = "Partiellement nuageux", icone = "02d",
            vitesseVent = 12.0, directionVent = 180, pression = 1013, visibilite = 10000, nuages = 40,
            conditionTravail = ConditionTravail(favorable = true, message = "Conditions favorables (données simulées — configurez METEO_API_KEY)", alertes = emptyList())
        )
    }

    private fun getPrevisionsSimulees(ville: String): PrevisionResponse {
        val jours = (0..4).map { i ->
            PrevisionJour(
                date = java.time.LocalDate.now().plusDays(i.toLong()).toString(),
                temperatureMin = 22.0 + i, temperatureMax = 30.0 + i,
                description = if (i % 2 == 0) "Ensoleillé" else "Pluie légère",
                icone = if (i % 2 == 0) "01d" else "10d",
                probPluie = if (i % 2 == 0) 0.1 else 0.6,
                vitesseVent = 10.0 + i * 2
            )
        }
        return PrevisionResponse(ville = ville, previsions = jours)
    }
}
