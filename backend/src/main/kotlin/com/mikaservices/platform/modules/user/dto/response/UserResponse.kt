package com.mikaservices.platform.modules.user.dto.response

import com.mikaservices.platform.common.enums.NiveauExperience
import com.mikaservices.platform.common.enums.TypeContrat
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class UserResponse(
    val id: Long,
    val matricule: String,
    val nom: String,
    val prenom: String,
    val email: String,
    val telephone: String?,
    val dateNaissance: LocalDate?,
    val adresse: String?,
    val ville: String?,
    val quartier: String?,
    val province: String?,
    val numeroCNI: String?,
    val numeroPasseport: String?,
    val dateEmbauche: LocalDate?,
    val photo: String?,
    val ficheMission: String?,
    val salaireMensuel: BigDecimal?,
    val typeContrat: TypeContrat?,
    val niveauExperience: NiveauExperience?,
    val actif: Boolean,
    val totpEnabled: Boolean,
    val mustChangePassword: Boolean,
    val lastLogin: LocalDateTime?,
    val roles: List<RoleResponse>,
    val departements: List<DepartementResponse>,
    val specialites: List<SpecialiteResponse>,
    val superieurHierarchique: UserSummaryResponse?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    /** Présent uniquement après création : true si l'email de bienvenue a été envoyé. */
    val welcomeEmailSent: Boolean? = null
)

data class UserSummaryResponse(
    val id: Long,
    val matricule: String,
    val nom: String,
    val prenom: String,
    val email: String
)
