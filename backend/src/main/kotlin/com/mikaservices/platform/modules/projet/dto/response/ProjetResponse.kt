package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.SourceFinancement
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.enums.ModeSuiviMensuel
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class ProjetResponse(
    val id: Long,
    val numeroMarche: String?,
    val nom: String,
    val description: String?,
    val type: TypeProjet,
    val types: List<TypeProjet>,
    val typePersonnalise: String? = null,
    val statut: StatutProjet,
    val client: ClientResponse?,
    val sourceFinancement: SourceFinancement?,
    val imputationBudgetaire: String?,
    val province: String?,
    val ville: String?,
    val quartier: String?,
    val montantHT: BigDecimal?,
    val montantTTC: BigDecimal?,
    val montantInitial: BigDecimal?,
    val montantRevise: BigDecimal?,
    val delaiMois: Int?,
    val modeSuiviMensuel: ModeSuiviMensuel,
    val dateDebut: LocalDate?,
    val dateFin: LocalDate?,
    val dateDebutReel: LocalDate?,
    val dateFinReelle: LocalDate?,
    val avancementGlobal: BigDecimal,
    val avancementPhysiquePct: BigDecimal?,
    val avancementFinancierPct: BigDecimal?,
    val delaiConsommePct: BigDecimal?,
    val besoinsMateriel: String?,
    val besoinsHumain: String?,
    val observations: String?,
    val propositionsAmelioration: String?,
    val responsableProjet: ProjetUserSummary?,
    val partenairePrincipal: String?,
    val actif: Boolean,
    val nombreSousProjets: Int = 0,
    val nombrePointsBloquantsOuverts: Int = 0,
    val avancementEtudes: List<AvancementEtudeProjetResponse> = emptyList(),
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class ProjetSummaryResponse(
    val id: Long,
    val numeroMarche: String? = null,
    val nom: String,
    val type: TypeProjet,
    val types: List<TypeProjet>,
    val typePersonnalise: String? = null,
    val statut: StatutProjet,
    val clientNom: String?,
    val montantHT: BigDecimal?,
    val avancementGlobal: BigDecimal,
    val dateDebut: LocalDate?,
    val dateFin: LocalDate?,
    val responsableNom: String?,
    /** ID du chef de projet (pour droits UI liste) */
    val responsableProjetId: Long? = null
)

data class ProjetUserSummary(
    val id: Long,
    val nom: String,
    val prenom: String,
    val email: String
)
