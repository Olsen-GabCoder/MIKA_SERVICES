package com.mikaservices.platform.modules.qualite.dto.request

import com.mikaservices.platform.modules.qualite.enums.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class EvenementQualiteCreateRequest(
    @field:NotNull val projetId: Long,
    @field:NotNull val typeEvenement: TypeEvenement,
    @field:NotEmpty val categories: Set<CategorieEvenement>,
    @field:NotNull val origine: OrigineEvenement,
    val ouvrageConcerne: String? = null,
    val controleExigeCctp: Boolean = false,
    @field:NotBlank val description: String,
    // Bloc sous-traitance (optionnel)
    val fournisseurNom: String? = null,
    val numeroBc: String? = null,
    val numeroBl: String? = null,
    val dateLivraison: LocalDate? = null,
    // Assignation des signataires par section
    val signataires: Map<NumeroSection, Long>? = null,
    // Signataires section 6 collégiale
    val signatairesSection6: Map<RoleCollegial, Long>? = null,
    val createurId: Long? = null,
)

data class EvenementQualiteUpdateRequest(
    val ouvrageConcerne: String? = null,
    val description: String? = null,
    val fournisseurNom: String? = null,
    val numeroBc: String? = null,
    val numeroBl: String? = null,
    val dateLivraison: LocalDate? = null,
    val controleExigeCctp: Boolean? = null,
)

data class SectionContenuRequest(
    val contenu: String? = null,
    val choixTraitement: ChoixTraitement? = null,
    val necessiteCapa: Boolean? = null,
    val actions: List<ActionTraitementRequest>? = null,
)

data class ActionTraitementRequest(
    val descriptionAction: String,
    val responsable: String? = null,
    val delaiPrevu: LocalDate? = null,
)

data class SignatureSectionRequest(
    val userId: Long,
)

data class SignatureCollegialeRequest(
    val userId: Long,
    val roleCollegial: RoleCollegial,
)
