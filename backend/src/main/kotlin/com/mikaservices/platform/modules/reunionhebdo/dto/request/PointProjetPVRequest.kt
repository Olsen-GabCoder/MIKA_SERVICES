package com.mikaservices.platform.modules.reunionhebdo.dto.request

import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

data class PointProjetPVRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,

    val avancementPhysiquePct: BigDecimal? = null,
    val avancementFinancierPct: BigDecimal? = null,
    val delaiConsommePct: BigDecimal? = null,
    val resumeTravauxPrevisions: String? = null,
    val pointsBloquantsResume: String? = null,
    val besoinsMateriel: String? = null,
    val besoinsHumain: String? = null,
    val propositionsAmelioration: String? = null,
    val ordreAffichage: Int = 0
)
