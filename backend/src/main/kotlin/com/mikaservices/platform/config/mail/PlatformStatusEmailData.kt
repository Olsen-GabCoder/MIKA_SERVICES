package com.mikaservices.platform.config.mail

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import java.math.BigDecimal
import java.time.LocalDate

/** Données d'un point bloquant inclus dans le rapport quotidien. */
data class PointBloquantEmailRow(
    val titre: String,
    val priorite: Priorite,
    val statut: StatutPointBloquant,
    val dateDetection: LocalDate
)

/** Données d'un projet inclus dans le rapport quotidien. */
data class ProjetEmailRow(
    val id: Long,
    val nom: String,
    val responsableNom: String?,
    val avancementPhysique: BigDecimal?,
    val avancementFinancier: BigDecimal?,
    val avancementGlobal: BigDecimal,
    val pointsBloquants: List<PointBloquantEmailRow>
)

/** Données globales de la plateforme pour le rapport quotidien à 09h00. */
data class PlatformStatusEmailData(
    val date: LocalDate,
    val projetsEnCours: List<ProjetEmailRow>,
    val projetsPlanifies: List<ProjetEmailRow>,
    val projetsReceptionProvisoire: List<ProjetEmailRow>
) {
    val totalProjets: Int get() = projetsEnCours.size + projetsPlanifies.size + projetsReceptionProvisoire.size
    val tousLesProjets: List<ProjetEmailRow> get() = projetsEnCours + projetsPlanifies + projetsReceptionProvisoire
    val totalPointsBloquants: Int get() = tousLesProjets.sumOf { it.pointsBloquants.size }
    val totalPointsCritiques: Int get() = tousLesProjets.sumOf { p ->
        p.pointsBloquants.count { it.priorite == Priorite.CRITIQUE || it.priorite == Priorite.URGENTE }
    }
}
