package com.mikaservices.platform.modules.qualite.dto.request

import com.mikaservices.platform.modules.qualite.enums.NatureReception
import com.mikaservices.platform.modules.qualite.enums.SousTypeReception
import com.mikaservices.platform.modules.qualite.enums.StatutReception
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class DemandeReceptionCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotBlank @field:Size(max = 300) val titre: String,
    @field:NotNull val nature: NatureReception,
    @field:NotNull val sousType: SousTypeReception,
    val description: String? = null,
    val zoneOuvrage: String? = null,
    val dateDemande: LocalDate? = null,
    val demandeurId: Long? = null,
    val moisReference: String? = null,
)

data class DemandeReceptionUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val zoneOuvrage: String? = null,
    val statut: StatutReception? = null,
    val dateDemande: LocalDate? = null,
    val dateDecision: LocalDate? = null,
    val decideurId: Long? = null,
    val observations: String? = null,
)
