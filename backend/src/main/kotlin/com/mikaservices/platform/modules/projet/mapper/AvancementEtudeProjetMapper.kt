package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.AvancementEtudeProjetResponse
import com.mikaservices.platform.modules.projet.entity.AvancementEtudeProjet

object AvancementEtudeProjetMapper {
    fun toResponse(entity: AvancementEtudeProjet): AvancementEtudeProjetResponse = AvancementEtudeProjetResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        phase = entity.phase,
        avancementPct = entity.avancementPct,
        dateDepot = entity.dateDepot,
        etatValidation = entity.etatValidation
    )
}
