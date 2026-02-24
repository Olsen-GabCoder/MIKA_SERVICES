package com.mikaservices.platform.modules.projet.dto.request

import com.mikaservices.platform.common.enums.StatutSousProjet
import com.mikaservices.platform.common.enums.TypeTravaux
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class SousProjetCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,

    @field:NotBlank(message = "Le code est obligatoire")
    @field:Size(max = 50)
    val code: String,

    @field:NotBlank(message = "Le nom est obligatoire")
    @field:Size(max = 300)
    val nom: String,

    val description: String? = null,

    @field:NotNull(message = "Le type de travaux est obligatoire")
    val typeTravaux: TypeTravaux,

    val statut: StatutSousProjet = StatutSousProjet.PLANIFIE,
    val montantHT: BigDecimal? = null,
    val montantTTC: BigDecimal? = null,
    val delaiMois: Int? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val responsableId: Long? = null
)

data class SousProjetUpdateRequest(
    val nom: String? = null,
    val description: String? = null,
    val typeTravaux: TypeTravaux? = null,
    val statut: StatutSousProjet? = null,
    val montantHT: BigDecimal? = null,
    val montantTTC: BigDecimal? = null,
    val delaiMois: Int? = null,
    val dateDebut: LocalDate? = null,
    val dateFin: LocalDate? = null,
    val avancementPhysique: BigDecimal? = null,
    val responsableId: Long? = null
)
