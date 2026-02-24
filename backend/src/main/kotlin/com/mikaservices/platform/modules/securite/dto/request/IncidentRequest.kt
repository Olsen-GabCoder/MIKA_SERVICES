package com.mikaservices.platform.modules.securite.dto.request

import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.StatutIncident
import com.mikaservices.platform.common.enums.TypeIncident
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.time.LocalTime

data class IncidentCreateRequest(
    @field:NotNull(message = "L'ID du projet est obligatoire")
    val projetId: Long,
    @field:NotBlank(message = "Le titre est obligatoire") @field:Size(max = 300)
    val titre: String,
    val description: String? = null,
    @field:NotNull(message = "Le type d'incident est obligatoire")
    val typeIncident: TypeIncident,
    @field:NotNull(message = "La gravité est obligatoire")
    val gravite: GraviteIncident,
    @field:NotNull(message = "La date de l'incident est obligatoire")
    val dateIncident: LocalDate,
    val heureIncident: LocalTime? = null,
    val lieu: String? = null,
    val declareParId: Long? = null,
    val nbBlesses: Int = 0,
    val arretTravail: Boolean = false,
    val nbJoursArret: Int = 0,
    val mesuresImmediates: String? = null
)

data class IncidentUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val statut: StatutIncident? = null,
    val gravite: GraviteIncident? = null,
    val causeIdentifiee: String? = null,
    val mesuresImmediates: String? = null,
    val analyseCause: String? = null,
    val nbBlesses: Int? = null,
    val arretTravail: Boolean? = null,
    val nbJoursArret: Int? = null
)
