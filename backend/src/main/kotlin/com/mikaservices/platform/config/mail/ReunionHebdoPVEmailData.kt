package com.mikaservices.platform.config.mail

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

/** Données d'un point projet inclus dans le PV hebdomadaire automatique. */
data class PointProjetPVEmailRow(
    val ordreAffichage: Int,
    val projetNom: String,
    val projetCode: String,
    val chefProjetNom: String?,
    val avancementPhysiquePct: BigDecimal?,
    val avancementFinancierPct: BigDecimal?,
    val delaiConsommePct: BigDecimal?,
    val resumeTravauxPrevisions: String?,
    val pointsBloquantsResume: String?,
    val besoinsMateriel: String?,
    val besoinsHumain: String?,
    val propositionsAmelioration: String?
)

/**
 * Données de la réunion hebdomadaire pour l'envoi automatique du PV chaque jeudi à 18h00.
 * Pas de liste de participants — uniquement les informations de la réunion et les points projets
 * saisis par les chefs de chantiers.
 */
data class ReunionHebdoPVEmailData(
    val reunionId: Long,
    val dateReunion: LocalDate,
    val lieu: String?,
    val heureDebut: LocalTime?,
    val heureFin: LocalTime?,
    val ordreDuJour: String?,
    val divers: String?,
    val pointsProjets: List<PointProjetPVEmailRow>
) {
    val totalAffaires: Int get() = pointsProjets.size
}
