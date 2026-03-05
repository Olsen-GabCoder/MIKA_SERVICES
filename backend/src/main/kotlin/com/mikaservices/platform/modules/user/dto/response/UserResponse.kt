package com.mikaservices.platform.modules.user.dto.response

import com.mikaservices.platform.common.enums.NiveauExperience
import com.mikaservices.platform.common.enums.Sexe
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
    val sexe: Sexe?,
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
    val welcomeEmailSent: Boolean? = null,
    val emailNotificationsEnabled: Boolean = true,
    val alertNewLoginEnabled: Boolean = true,
    val dailyDigestEnabled: Boolean = false,
    val weeklyDigestEnabled: Boolean = false,
    val digestTime: String? = "18:00",
    val inAppNotificationsEnabled: Boolean = true,
    val notificationSoundEnabled: Boolean = true,
    /** Durée de session par défaut : "SHORT" (1 h) ou "LONG" (5 h). Null = choix au login (rememberMe). */
    val defaultSessionDuration: String? = null,
    /** Déconnexion à la fermeture du navigateur (client stocke le token en sessionStorage). */
    val logoutOnBrowserClose: Boolean = false
)

data class UserSummaryResponse(
    val id: Long,
    val matricule: String,
    val nom: String,
    val prenom: String,
    val email: String
)

/** Résumé utilisateur pour la messagerie (liste destinataires). Accessible à tout utilisateur connecté. */
data class UserForMessagingResponse(
    val id: Long,
    val nom: String,
    val prenom: String,
    val email: String,
    val roleLabel: String
)
