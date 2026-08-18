package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.SourceFinancement
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.enums.ModeSuiviMensuel
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class ProjetCreateRequest(
    @field:Size(max = 100, message = "Le numéro de marché ne peut pas dépasser 100 caractères")
    val numeroMarche: String? = null,

    @field:NotBlank(message = "L'intitulé du projet est obligatoire")
    @field:Size(max = 300, message = "L'intitulé ne peut pas dépasser 300 caractères")
    val nom: String,

    val description: String? = null,

    @field:NotEmpty(message = "Au moins un type de projet est obligatoire")
    val types: List<TypeProjet>,

    @field:Size(max = 150, message = "Le libellé personnalisé ne peut pas dépasser 150 caractères")
    val typePersonnalise: String? = null,

    val statut: StatutProjet = StatutProjet.INITIALISATION,
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
    @field:Positive(message = "Le délai en mois doit être supérieur à 0")
    val delaiMois: Int? = null,
    val modeSuiviMensuel: ModeSuiviMensuel = ModeSuiviMensuel.AUTO,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val responsableProjetId: Long? = null,
    val partenairePrincipal: String? = null,
    val propositionsAmelioration: String? = null,
    val partenaireIds: List<Long> = emptyList()
)
