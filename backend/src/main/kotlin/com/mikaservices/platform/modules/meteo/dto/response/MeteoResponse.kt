package com.mikaservices.platform.modules.meteo.dto.response

data class MeteoResponse(
    val ville: String,
    val temperature: Double,
    val temperatureRessentie: Double,
    val humidite: Int,
    val description: String,
    val icone: String,
    val vitesseVent: Double,
    val directionVent: Int,
    val pression: Int,
    val visibilite: Int,
    val nuages: Int,
    val conditionTravail: ConditionTravail
)

data class ConditionTravail(
    val favorable: Boolean,
    val message: String,
    val alertes: List<String>
)

data class PrevisionJour(
    val date: String,
    val temperatureMin: Double,
    val temperatureMax: Double,
    val description: String,
    val icone: String,
    val probPluie: Double,
    val vitesseVent: Double
)

data class PrevisionResponse(
    val ville: String,
    val previsions: List<PrevisionJour>
)
