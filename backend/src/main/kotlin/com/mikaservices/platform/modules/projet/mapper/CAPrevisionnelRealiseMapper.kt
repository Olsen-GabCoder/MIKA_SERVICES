package com.mikaservices.platform.modules.projet.mapper

import com.mikaservices.platform.modules.projet.dto.response.CAPrevisionnelRealiseResponse
import com.mikaservices.platform.modules.projet.entity.CAPrevisionnelRealise

object CAPrevisionnelRealiseMapper {

    fun toResponse(entity: CAPrevisionnelRealise): CAPrevisionnelRealiseResponse = CAPrevisionnelRealiseResponse(
        id = entity.id!!,
        projetId = entity.projet.id!!,
        mois = entity.mois,
        annee = entity.annee,
        caPrevisionnel = entity.caPrevisionnel,
        caRealise = entity.caRealise,
        ecart = entity.ecart,
        avancementCumule = entity.avancementCumule
    )
}
