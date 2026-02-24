package com.mikaservices.platform.modules.planning.mapper

import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.modules.planning.dto.response.TacheResponse
import com.mikaservices.platform.modules.planning.entity.Tache
import com.mikaservices.platform.modules.projet.mapper.ProjetMapper
import java.time.LocalDate

object TacheMapper {

    fun toResponse(entity: Tache): TacheResponse {
        val enRetard = entity.dateEcheance != null &&
                entity.dateEcheance!!.isBefore(LocalDate.now()) &&
                entity.statut in listOf(StatutTache.A_FAIRE, StatutTache.EN_COURS)

        return TacheResponse(
            id = entity.id!!,
            projetId = entity.projet.id!!,
            projetNom = entity.projet.nom,
            titre = entity.titre,
            description = entity.description,
            statut = entity.statut,
            priorite = entity.priorite,
            assigneA = ProjetMapper.toUserSummary(entity.assigneA),
            dateDebut = entity.dateDebut,
            dateFin = entity.dateFin,
            dateEcheance = entity.dateEcheance,
            pourcentageAvancement = entity.pourcentageAvancement,
            enRetard = enRetard,
            tacheParentId = entity.tacheParent?.id,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
