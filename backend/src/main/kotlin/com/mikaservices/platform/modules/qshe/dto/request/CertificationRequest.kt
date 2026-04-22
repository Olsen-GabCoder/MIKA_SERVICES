package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.TypeCertification
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class CertificationCreateRequest(
    @field:NotNull val userId: Long,
    @field:NotNull val typeCertification: TypeCertification,
    @field:NotBlank @field:Size(max = 300) val libelle: String,
    val categorieNiveau: String? = null,
    val organismeFormation: String? = null,
    val numeroCertificat: String? = null,
    val dateObtention: LocalDate? = null,
    val dateExpiration: LocalDate? = null,
    val dureeValiditeMois: Int? = null,
    val documentUrl: String? = null,
    val observations: String? = null
)

data class CertificationUpdateRequest(
    val typeCertification: TypeCertification? = null,
    val libelle: String? = null,
    val categorieNiveau: String? = null,
    val organismeFormation: String? = null,
    val numeroCertificat: String? = null,
    val dateObtention: LocalDate? = null,
    val dateExpiration: LocalDate? = null,
    val dureeValiditeMois: Int? = null,
    val documentUrl: String? = null,
    val observations: String? = null
)
