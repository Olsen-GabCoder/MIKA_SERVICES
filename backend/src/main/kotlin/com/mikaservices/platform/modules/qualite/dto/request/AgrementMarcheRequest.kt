package com.mikaservices.platform.modules.qualite.dto.request

import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class AgrementMarcheCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotBlank @field:Size(max = 300) val objet: String,
    @field:NotBlank @field:Size(max = 300) val titre: String,
    val statut: StatutAgrement? = null,
    val description: String? = null,
    val dateSoumission: LocalDate? = null,
    val moisReference: String? = null,
)

data class AgrementMarcheUpdateRequest(
    val objet: String? = null,
    val titre: String? = null,
    val description: String? = null,
    val statut: StatutAgrement? = null,
    val dateSoumission: LocalDate? = null,
    val dateDecision: LocalDate? = null,
    val decideurId: Long? = null,
    val observations: String? = null,
)
