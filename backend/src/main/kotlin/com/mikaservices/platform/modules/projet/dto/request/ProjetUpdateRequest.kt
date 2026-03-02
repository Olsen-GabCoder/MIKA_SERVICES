package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.SourceFinancement
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.enums.ModeSuiviMensuel
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class ProjetUpdateRequest(
    val numeroMarche: String? = null,

    @field:Size(max = 300, message = "Le nom ne peut pas dépasser 300 caractères")
    val nom: String? = null,

    val description: String? = null,
    val types: List<TypeProjet>? = null,

    @field:Size(max = 150, message = "Le libellé personnalisé ne peut pas dépasser 150 caractères")
    val typePersonnalise: String? = null,

    val statut: StatutProjet? = null,
    val clientId: Long? = null,
    val sourceFinancement: SourceFinancement? = null,
    val imputationBudgetaire: String? = null,
    val province: String? = null,
    val ville: String? = null,
    val quartier: String? = null,
    val montantHT: BigDecimal? = null,
    val montantTTC: BigDecimal? = null,
    val montantInitial: BigDecimal? = null,
    val montantRevise: BigDecimal? = null,
    val delaiMois: Int? = null,
    val modeSuiviMensuel: ModeSuiviMensuel? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val dateDebutReel: LocalDate? = null,
    val dateFinReelle: LocalDate? = null,
    val avancementGlobal: BigDecimal? = null,
    val avancementPhysiquePct: BigDecimal? = null,
    val avancementFinancierPct: BigDecimal? = null,
    val delaiConsommePct: BigDecimal? = null,
    val besoinsMateriel: String? = null,
    val besoinsHumain: String? = null,
    val observations: String? = null,
    val propositionsAmelioration: String? = null,
    val responsableProjetId: Long? = null,
    val partenairePrincipal: String? = null,
    val partenaireIds: List<Long>? = null
)
