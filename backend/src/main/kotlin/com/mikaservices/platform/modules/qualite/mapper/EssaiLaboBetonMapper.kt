package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.modules.qualite.dto.response.EssaiLaboBetonResponse
import com.mikaservices.platform.modules.qualite.entity.EssaiLaboratoireBeton

object EssaiLaboBetonMapper {

    fun toResponse(e: EssaiLaboratoireBeton): EssaiLaboBetonResponse = EssaiLaboBetonResponse(
        id = e.id!!,
        projetId = e.projet.id!!,
        projetNom = e.projet.nom,
        moisReference = e.moisReference,
        nbCamionsMalaxeursVolumeCoulee = e.nbCamionsMalaxeursVolumeCoulee,
        nbEssaisSlump = e.nbEssaisSlump,
        nbJoursCoulage = e.nbJoursCoulage,
        nbPrelevements = e.nbPrelevements,
        observations = e.observations,
        saisiParId = e.saisiPar?.id,
        saisiParNom = e.saisiPar?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )
}
