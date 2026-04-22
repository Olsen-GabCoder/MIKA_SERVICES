package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.modules.qualite.dto.response.LeveeTopoResponse
import com.mikaservices.platform.modules.qualite.entity.LeveeTopographique

object LeveeTopoMapper {

    fun toResponse(e: LeveeTopographique): LeveeTopoResponse = LeveeTopoResponse(
        id = e.id!!,
        projetId = e.projet.id!!,
        projetNom = e.projet.nom,
        moisReference = e.moisReference,
        nbProfilsImplantes = e.nbProfilsImplantes,
        nbProfilsReceptionnes = e.nbProfilsReceptionnes,
        nbControlesRealises = e.nbControlesRealises,
        observations = e.observations,
        saisiParId = e.saisiPar?.id,
        saisiParNom = e.saisiPar?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )
}
