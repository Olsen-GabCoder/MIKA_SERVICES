package com.mikaservices.platform.modules.materiel.dto.response

data class EnginStatsResponse(
    val totalEngins: Long,
    val enService: Long,
    val disponibles: Long,
    val enPanne: Long,
    val enMaintenance: Long,
    val tauxDisponibilite: Double,
    val parType: Map<String, Long>,
    val parStatut: Map<String, Long>,
    val alertesMaintenance: Long,
    val incidentsNonResolus: Long
)
