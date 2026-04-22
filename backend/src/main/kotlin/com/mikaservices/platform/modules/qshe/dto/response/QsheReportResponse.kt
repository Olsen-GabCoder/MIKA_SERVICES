package com.mikaservices.platform.modules.qshe.dto.response

/**
 * Rapport QSHE mensuel agrege — toutes les donnees d'un projet en un seul appel.
 */
data class QsheReportResponse(
    val projetId: Long,
    val projetNom: String,
    val incidents: IncidentSummaryResponse,
    val actions: ActionCorrectiveSummaryResponse,
    // TODO Qualité v2 — controles/nonConformites retirés (nettoyage #0), à recâbler avec EvenementQualite au livrable #8
    val risques: RisqueSummaryResponse,
    val certifications: CertificationSummaryResponse,
    val epiSummary: EpiSummaryResponse,
    val causeries: CauserieSummaryResponse,
    val permis: PermisTravailSummaryResponse,
    val environnement: EnvironnementSummaryResponse
)
