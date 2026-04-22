package com.mikaservices.platform.modules.qshe.mapper

import com.mikaservices.platform.modules.qshe.dto.response.CertificationResponse
import com.mikaservices.platform.modules.qshe.entity.Certification

object CertificationMapper {
    fun toResponse(e: Certification) = CertificationResponse(
        id = e.id!!, userId = e.user.id!!, userNom = "${e.user.prenom} ${e.user.nom}",
        typeCertification = e.typeCertification, libelle = e.libelle,
        categorieNiveau = e.categorieNiveau, organismeFormation = e.organismeFormation,
        numeroCertificat = e.numeroCertificat, dateObtention = e.dateObtention,
        dateExpiration = e.dateExpiration, dureeValiditeMois = e.dureeValiditeMois,
        documentUrl = e.documentUrl, observations = e.observations,
        statut = e.statutCalcule, joursAvantExpiration = e.joursAvantExpiration,
        createdAt = e.createdAt, updatedAt = e.updatedAt
    )
}
