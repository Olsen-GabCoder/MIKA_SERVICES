package com.mikaservices.platform.modules.ia.dto

import com.mikaservices.platform.common.enums.PhaseEtude
import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.TypePrevision
import java.math.BigDecimal

data class RapportAnalyseResponse(
    val suiviMensuel: List<SuiviMensuelExtrait>?,
    val previsions: List<PrevisionExtraite>?,
    val pointsBloquants: List<PointBloquantExtrait>?,
    val avancementEtudes: List<AvancementEtudeExtrait>?,
    val avancementPhysiquePct: Double?,
    val avancementFinancierPct: Double?,
    val delaiConsommePct: Double?,
    val besoinsMateriel: String?,
    val besoinsHumain: String?,
    val observations: String?,
    val propositionsAmelioration: String?,
    val avertissements: List<String>,
    val champsExtraits: List<String>,
    val doublons: DoublonsDetectes?
)

data class SuiviMensuelExtrait(
    val mois: Int,
    val annee: Int,
    val caPrevisionnel: BigDecimal?,
    val caRealise: BigDecimal?
)

data class PrevisionExtraite(
    val description: String,
    val type: TypePrevision,
    val semaine: Int,
    val annee: Int,
    val avancementPct: Int?
)

data class PointBloquantExtrait(
    val titre: String,
    val description: String?,
    val priorite: Priorite,
    val actionCorrective: String?
)

data class AvancementEtudeExtrait(
    val phase: PhaseEtude,
    val avancementPct: BigDecimal?,
    val etatValidation: String?
)

data class DoublonsDetectes(
    val suiviMensuel: List<DoublonCA>?,
    val previsions: List<DoublonPrevision>?,
    val pointsBloquants: List<DoublonPB>?
)

data class DoublonCA(
    val mois: Int,
    val annee: Int,
    val caReelExistant: BigDecimal?,
    val caPrevisionnelExistant: BigDecimal?
)

data class DoublonPrevision(
    val previsionExistanteId: Long,
    val descriptionExistante: String,
    val descriptionNouvelle: String,
    val semaine: Int,
    val annee: Int
)

data class DoublonPB(
    val pointBloquantExistantId: Long,
    val titreExistant: String,
    val titreNouveau: String,
    val statutExistant: String
)
