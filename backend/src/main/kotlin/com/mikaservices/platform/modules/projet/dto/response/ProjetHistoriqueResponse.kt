package com.mikaservices.platform.modules.projet.dto.response

import java.math.BigDecimal
import java.time.LocalDate

/**
 * Réponse agrégée pour l'historique d'un projet (semaines passées).
 */
data class ProjetHistoriqueResponse(
    val projetId: Long,
    val projetNom: String,
    val periodes: List<PeriodeHistoriqueResponse>
)

/**
 * Une période (semaine) dans l'historique : tâches, points bloquants, résumé PV.
 */
data class PeriodeHistoriqueResponse(
    val semaine: Int,
    val annee: Int,
    val dateReunion: LocalDate?,
    val previsions: List<PrevisionResponse>,
    val pointsBloquants: List<PointBloquantResponse>,
    val pvResume: PvResumeResponse?
)

/**
 * Contenu du point projet dans un PV hebdo (résumés, indicateurs).
 */
data class PvResumeResponse(
    val reunionId: Long,
    val dateReunion: LocalDate,
    val resumeTravauxPrevisions: String?,
    val pointsBloquantsResume: String?,
    val besoinsMateriel: String?,
    val besoinsHumain: String?,
    val propositionsAmelioration: String?,
    val avancementPhysiquePct: BigDecimal?,
    val avancementFinancierPct: BigDecimal?,
    val delaiConsommePct: BigDecimal?
)
