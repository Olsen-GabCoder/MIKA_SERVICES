package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.SourceFinancement
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.enums.ModeSuiviMensuel
import com.mikaservices.platform.common.enums.MotifArretChantier
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
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
    @field:DecimalMin(value = "-90", message = "La latitude doit être entre -90 et 90")
    @field:DecimalMax(value = "90", message = "La latitude doit être entre -90 et 90")
    val latitude: Double? = null,
    @field:DecimalMin(value = "-180", message = "La longitude doit être entre -180 et 180")
    @field:DecimalMax(value = "180", message = "La longitude doit être entre -180 et 180")
    val longitude: Double? = null,
    @field:PositiveOrZero(message = "Le montant HT ne peut pas être négatif")
    val montantHT: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le montant TTC ne peut pas être négatif")
    val montantTTC: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le montant initial ne peut pas être négatif")
    val montantInitial: BigDecimal? = null,
    @field:PositiveOrZero(message = "Le montant révisé ne peut pas être négatif")
    val montantRevise: BigDecimal? = null,
    @field:Positive(message = "Le délai en mois doit être supérieur à 0")
    val delaiMois: Int? = null,
    val modeSuiviMensuel: ModeSuiviMensuel? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val dateDebutReel: LocalDate? = null,
    val dateFinReelle: LocalDate? = null,
    @field:DecimalMin(value = "0", message = "L'avancement global doit être entre 0 et 100")
    @field:DecimalMax(value = "100", message = "L'avancement global doit être entre 0 et 100")
    val avancementGlobal: BigDecimal? = null,
    @field:DecimalMin(value = "0", message = "L'avancement physique doit être entre 0 et 100")
    @field:DecimalMax(value = "100", message = "L'avancement physique doit être entre 0 et 100")
    val avancementPhysiquePct: BigDecimal? = null,
    @field:DecimalMin(value = "0", message = "L'avancement financier doit être entre 0 et 100")
    @field:DecimalMax(value = "100", message = "L'avancement financier doit être entre 0 et 100")
    val avancementFinancierPct: BigDecimal? = null,
    @field:DecimalMin(value = "0", message = "Le délai consommé ne peut pas être négatif")
    val delaiConsommePct: BigDecimal? = null,
    val besoinsMateriel: String? = null,
    val besoinsHumain: String? = null,
    val observations: String? = null,
    val propositionsAmelioration: String? = null,
    val responsableProjetId: Long? = null,
    val partenairePrincipal: String? = null,
    val partenaireIds: List<Long>? = null,
    val chantierActif: Boolean? = null,
    val motifArretChantier: MotifArretChantier? = null,
    val detailArretChantier: String? = null,
    val dateArretChantier: LocalDate? = null
)
