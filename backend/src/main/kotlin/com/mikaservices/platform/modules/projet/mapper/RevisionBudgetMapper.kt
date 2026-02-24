package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.RevisionBudgetResponse
import com.mikaservices.platform.modules.projet.entity.RevisionBudget

object RevisionBudgetMapper {

    fun toResponse(entity: RevisionBudget): RevisionBudgetResponse = RevisionBudgetResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        ancienMontant = entity.ancienMontant,
        nouveauMontant = entity.nouveauMontant,
        motif = entity.motif,
        dateRevision = entity.dateRevision,
        validePar = ProjetMapper.toUserSummary(entity.validePar),
        createdAt = entity.createdAt
    )
}
