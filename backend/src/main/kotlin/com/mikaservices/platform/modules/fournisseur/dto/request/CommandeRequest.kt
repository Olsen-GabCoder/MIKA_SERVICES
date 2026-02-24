package com.mikaservices.platform.modules.fournisseur.dto.request

import com.mikaservices.platform.common.enums.StatutCommande
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate

data class CommandeCreateRequest(
    @field:NotNull val fournisseurId: Long,
    val projetId: Long? = null,
    @field:NotBlank val designation: String,
    val montantTotal: BigDecimal? = null,
    val dateCommande: LocalDate? = null,
    val dateLivraisonPrevue: LocalDate? = null,
    val notes: String? = null
)

data class CommandeUpdateRequest(
    val designation: String? = null,
    val montantTotal: BigDecimal? = null,
    val statut: StatutCommande? = null,
    val dateLivraisonPrevue: LocalDate? = null,
    val dateLivraisonEffective: LocalDate? = null,
    val notes: String? = null
)
