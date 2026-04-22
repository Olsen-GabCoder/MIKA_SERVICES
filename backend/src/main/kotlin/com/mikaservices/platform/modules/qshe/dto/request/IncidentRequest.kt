package com.mikaservices.platform.modules.qshe.dto.request

import com.mikaservices.platform.modules.qshe.enums.GraviteIncident
import com.mikaservices.platform.modules.qshe.enums.LocalisationCorporelle
import com.mikaservices.platform.modules.qshe.enums.StatutIncident
import com.mikaservices.platform.modules.qshe.enums.TypeIncident
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.time.LocalTime

data class IncidentCreateRequest(
    @field:NotNull(message = "Le projet est obligatoire")
    val projetId: Long,

    @field:NotBlank(message = "Le titre est obligatoire")
    @field:Size(max = 300)
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
    val zoneChantier: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val sousProjetId: Long? = null,
    val declareParId: Long? = null,

    val descriptionCirconstances: String? = null,
    val activiteEnCours: String? = null,
    val equipementImplique: String? = null,
    val epiPortes: String? = null,
    val causeImmediate: String? = null,
    val causeRacine: String? = null,
    val mesuresConservatoires: String? = null,

    @field:Valid
    val victimes: List<VictimeCreateRequest> = emptyList(),

    @field:Valid
    val temoins: List<TemoinCreateRequest> = emptyList()
)

data class IncidentUpdateRequest(
    val titre: String? = null,
    val description: String? = null,
    val typeIncident: TypeIncident? = null,
    val gravite: GraviteIncident? = null,
    val statut: StatutIncident? = null,
    val dateIncident: LocalDate? = null,
    val heureIncident: LocalTime? = null,
    val lieu: String? = null,
    val zoneChantier: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val sousProjetId: Long? = null,
    val descriptionCirconstances: String? = null,
    val activiteEnCours: String? = null,
    val equipementImplique: String? = null,
    val epiPortes: String? = null,
    val causeImmediate: String? = null,
    val causeRacine: String? = null,
    val mesuresConservatoires: String? = null,
    val declarationCnssEffectuee: Boolean? = null,
    val dateDeclarationCnss: LocalDate? = null,
    val declarationInspectionEffectuee: Boolean? = null,
    val dateDeclarationInspection: LocalDate? = null
)

data class VictimeCreateRequest(
    @field:NotBlank(message = "Le nom de la victime est obligatoire")
    val nom: String,

    @field:NotBlank(message = "Le prénom de la victime est obligatoire")
    val prenom: String,

    val userId: Long? = null,
    val poste: String? = null,
    val entreprise: String? = null,
    val anciennete: String? = null,
    val typeContrat: String? = null,
    val natureLesion: String? = null,
    val localisationCorporelle: LocalisationCorporelle? = null,
    val descriptionBlessure: String? = null,
    val arretTravail: Boolean = false,
    val nbJoursArret: Int = 0,
    val hospitalisation: Boolean = false
)

data class TemoinCreateRequest(
    @field:NotBlank(message = "Le nom du témoin est obligatoire")
    val nom: String,

    val prenom: String? = null,
    val telephone: String? = null,
    val email: String? = null,
    val entreprise: String? = null,
    val temoignage: String? = null
)
