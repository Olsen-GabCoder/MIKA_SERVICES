package com.mikaservices.platform.modules.qualite.dto.request

import com.mikaservices.platform.common.enums.StatutControleQualite
import com.mikaservices.platform.common.enums.TypeControle
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class ControleQualiteCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,
    @field:NotBlank(message = "Le titre est obligatoire") @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    @field:NotNull(message = "Le type de contrôle est obligatoire")
    val typeControle: TypeControle,
    val inspecteurId: Long? = null,
    val datePlanifiee: LocalDate? = null,
    val zoneControlee: String? = null,
    val criteresVerification: String? = null
)

data class ControleQualiteUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val statut: StatutControleQualite? = null,
    val inspecteurId: Long? = null,
    val datePlanifiee: LocalDate? = null,
    val dateRealisation: LocalDate? = null,
    val zoneControlee: String? = null,
    val criteresVerification: String? = null,
    val observations: String? = null,
    val noteGlobale: Int? = null
)
