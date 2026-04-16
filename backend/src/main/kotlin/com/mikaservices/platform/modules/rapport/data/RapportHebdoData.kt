package com.mikaservices.platform.modules.rapport.data

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import java.math.BigDecimal
import java.time.LocalDate

/** Un point bloquant actif du projet, inclus dans le rapport hebdomadaire. */
data class PointBloquantRapportRow(
    val titre: String,
    val priorite: Priorite,
    val statut: StatutPointBloquant
)

/** Données d'un projet actif pour le rapport hebdomadaire PDF. */
data class ProjetRapportRow(
    val id: Long,
    val nom: String,
    val codeProjet: String,
    val responsableNom: String?,
    val avancementPhysiquePct: BigDecimal?,
    val avancementFinancierPct: BigDecimal?,
    val delaiConsommePct: BigDecimal?,
    val besoinsMateriel: String?,
    val besoinsHumain: String?,
    val observations: String?,
    val propositionsAmelioration: String?,
    val pointsBloquants: List<PointBloquantRapportRow>
)

/**
 * Données complètes du rapport hebdomadaire envoyé chaque jeudi à 18h.
 * Source : entités Projet directement (aucune dépendance envers ReunionHebdo).
 */
data class RapportHebdoData(
    val semaine: Int,
    val annee: Int,
    val dateEmission: LocalDate,
    val projetsEnCours: List<ProjetRapportRow>,
    val projetsPlanifies: List<ProjetRapportRow>,
    val projetsEnAttente: List<ProjetRapportRow>,
    val projetsReceptionProvisoire: List<ProjetRapportRow>,
    val projetsReceptionDefinitive: List<ProjetRapportRow>,
    val projetsSuspendus: List<ProjetRapportRow>
) {
    val tousLesProjets: List<ProjetRapportRow>
        get() = projetsEnCours + projetsPlanifies + projetsEnAttente +
                projetsReceptionProvisoire + projetsReceptionDefinitive + projetsSuspendus
    val totalProjets: Int get() = tousLesProjets.size
    val totalPointsBloquants: Int get() = tousLesProjets.sumOf { it.pointsBloquants.size }
}
