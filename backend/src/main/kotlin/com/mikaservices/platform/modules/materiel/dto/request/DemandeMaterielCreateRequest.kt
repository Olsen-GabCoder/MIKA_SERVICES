package com.mikaservices.platform.modules.materiel.dto.request

import com.mikaservices.platform.common.enums.PrioriteDemandeMateriel
import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class DemandeMaterielLignePayload(
    @field:NotNull(message = "La désignation est obligatoire")
    val designation: String?,
    val materiauId: Long? = null,
    @field:NotNull(message = "La quantité est obligatoire")
    val quantite: BigDecimal?,
    @field:NotNull(message = "L'unité est obligatoire")
    val unite: String?,
    val prixUnitaireEst: BigDecimal? = null,
    val fournisseurSuggere: String? = null,
)

data class DemandeMaterielCreateRequest(
    @field:NotNull(message = "Le projet est obligatoire")
    val projetId: Long?,
    val priorite: PrioriteDemandeMateriel = PrioriteDemandeMateriel.NORMALE,
    val dateSouhaitee: LocalDate? = null,
    val commentaire: String? = null,
    @field:NotEmpty(message = "Au moins une ligne est requise")
    @field:Valid
    val lignes: List<DemandeMaterielLignePayload>?,
)
