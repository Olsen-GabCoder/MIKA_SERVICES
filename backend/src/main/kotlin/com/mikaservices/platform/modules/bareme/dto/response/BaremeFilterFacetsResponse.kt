package com.mikaservices.platform.modules.bareme.dto.response

/**
 * Valeurs distinctes pour les filtres du catalogue barème (toute la base, pas seulement la page affichée).
 */
data class BaremeFilterFacetsResponse(
    val categories: List<String>,
    val familles: List<String>,
    val unites: List<String>,
    val fournisseurs: List<String>,
    val articles: List<String>
)
