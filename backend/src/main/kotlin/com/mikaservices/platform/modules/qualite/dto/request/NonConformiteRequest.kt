package com.mikaservices.platform.modules.qualite.dto.request

import com.mikaservices.platform.common.enums.GraviteNonConformite
import com.mikaservices.platform.common.enums.StatutNonConformite
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class NonConformiteCreateRequest(
    @field:NotNull(message = "L'ID du contrôle qualité est obligatoire")
    val controleQualiteId: Long,
    @field:NotBlank(message = "Le titre est obligatoire") @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    @field:NotNull(message = "La gravité est obligatoire")
    val gravite: GraviteNonConformite,
    val responsableTraitementId: Long? = null,
    val dateDetection: LocalDate? = null,
    val dateEcheanceCorrection: LocalDate? = null
)

data class NonConformiteUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val gravite: GraviteNonConformite? = null,
    val statut: StatutNonConformite? = null,
    val responsableTraitementId: Long? = null,
    val causeIdentifiee: String? = null,
    val actionCorrective: String? = null,
    val dateEcheanceCorrection: LocalDate? = null,
    val preuveCorrection: String? = null
)
