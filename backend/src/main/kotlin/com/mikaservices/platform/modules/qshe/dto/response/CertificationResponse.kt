package com.mikaservices.platform.modules.qshe.dto.response

import com.mikaservices.platform.modules.qshe.enums.StatutCertification
import com.mikaservices.platform.modules.qshe.enums.TypeCertification
import java.time.LocalDate
import java.time.LocalDateTime

data class CertificationResponse(
    val id: Long, val userId: Long, val userNom: String,
    val typeCertification: TypeCertification, val libelle: String,
    val categorieNiveau: String?, val organismeFormation: String?,
    val numeroCertificat: String?, val dateObtention: LocalDate?,
    val dateExpiration: LocalDate?, val dureeValiditeMois: Int?,
    val documentUrl: String?, val observations: String?,
    val statut: StatutCertification, val joursAvantExpiration: Long?,
    val createdAt: LocalDateTime?, val updatedAt: LocalDateTime?
)

data class CertificationSummaryResponse(
    val totalCertifications: Long, val valides: Long,
    val expirentBientot: Long, val expirees: Long
)
