package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.DqeChapitreResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeLigneResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeSummaryResponse
import com.mikaservices.platform.modules.projet.entity.DqeChapitre
import com.mikaservices.platform.modules.projet.entity.DqeLigne
import java.math.BigDecimal
import java.math.RoundingMode

object DqeMapper {

    fun toChapitreResponse(entity: DqeChapitre): DqeChapitreResponse = DqeChapitreResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        numero = entity.numero,
        designation = entity.designation,
        ordre = entity.ordre,
        montantTotal = entity.montantTotal,
        montantExecute = entity.montantExecute,
        avancementPct = entity.avancementPct,
        nombreLignes = entity.lignes.size,
        lignes = entity.lignes.map { toLigneResponse(it) },
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )

    fun toLigneResponse(entity: DqeLigne): DqeLigneResponse = DqeLigneResponse(
        id = entity.id!!,
        chapitreId = entity.chapitre.id!!,
        numeroPoste = entity.numeroPoste,
        designation = entity.designation,
        unite = entity.unite,
        quantite = entity.quantite,
        prixUnitaire = entity.prixUnitaire,
        montantTotal = entity.montantTotal,
        avancementPct = entity.avancementPct,
        montantExecute = entity.montantExecute,
        ordre = entity.ordre,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt
    )

    fun toSummaryResponse(projetId: Long, chapitres: List<DqeChapitre>): DqeSummaryResponse {
        val totalMontant = chapitres.sumOf { it.montantTotal }
        val totalExecute = chapitres.sumOf { it.montantExecute }
        val totalLignes = chapitres.sumOf { it.lignes.size }
        val avancement = if (totalMontant.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal.ZERO
        } else {
            totalExecute.multiply(BigDecimal(100)).divide(totalMontant, 2, RoundingMode.HALF_UP)
        }

        return DqeSummaryResponse(
            projetId = projetId,
            nombreChapitres = chapitres.size,
            nombreLignes = totalLignes,
            montantTotalDqe = totalMontant,
            montantExecuteTotal = totalExecute,
            avancementGlobalPct = avancement
        )
    }
}
