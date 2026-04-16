package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.SourceFinancement
import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.common.enums.ModeSuiviMensuel
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
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

    val statut: StatutProjet = StatutProjet.EN_ATTENTE,
    val clientId: Long? = null,
    val sourceFinancement: SourceFinancement? = null,
    val imputationBudgetaire: String? = null,
    val province: String? = null,
    val ville: String? = null,
    val quartier: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val montantHT: BigDecimal? = null,
    val montantTTC: BigDecimal? = null,
    val montantInitial: BigDecimal? = null,
    val delaiMois: Int? = null,
    val modeSuiviMensuel: ModeSuiviMensuel = ModeSuiviMensuel.AUTO,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val responsableProjetId: Long? = null,
    val partenairePrincipal: String? = null,
    val propositionsAmelioration: String? = null,
    val partenaireIds: List<Long> = emptyList()
)
