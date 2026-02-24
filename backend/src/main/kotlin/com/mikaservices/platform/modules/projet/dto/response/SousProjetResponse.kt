package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.StatutSousProjet
import com.mikaservices.platform.common.enums.TypeTravaux
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class SousProjetResponse(
    val id: Long,
    val projetId: Long,
    val projetNom: String,
    val code: String,
    val nom: String,
    val description: String?,
    val typeTravaux: TypeTravaux,
    val statut: StatutSousProjet,
    val montantHT: BigDecimal?,
    val montantTTC: BigDecimal?,
    val delaiMois: Int?,
    val dateDebut: LocalDate?,
    val dateFin: LocalDate?,
    val avancementPhysique: BigDecimal,
    val responsable: ProjetUserSummary?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
