package com.mikaservices.platform.modules.user.dto.request

import jakarta.validation.constraints.*
import java.time.LocalDate

/**
 * Mise à jour du profil par l'utilisateur connecté (PATCH /users/me).
 * Champs limités à ceux modifiables depuis la page Mon profil.
 */
data class UpdateMyProfileRequest(
    @field:NotBlank(message = "Le nom est obligatoire")
    @field:Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    val nom: String,

    @field:NotBlank(message = "Le prénom est obligatoire")
    @field:Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères")
    val prenom: String,

    @field:NotBlank(message = "L'email est obligatoire")
    @field:Email(message = "L'email doit être valide")
    @field:Size(max = 100, message = "L'email ne doit pas dépasser 100 caractères")
    val email: String,

    @field:Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères")
    val telephone: String? = null,

    val dateEmbauche: LocalDate? = null,

    @field:Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    val adresse: String? = null,

    @field:Size(max = 100, message = "La ville ne doit pas dépasser 100 caractères")
    val ville: String? = null,

    @field:Size(max = 100, message = "Le quartier ne doit pas dépasser 100 caractères")
    val quartier: String? = null,

    @field:Size(max = 100, message = "La province ne doit pas dépasser 100 caractères")
    val province: String? = null,

    @field:Size(max = 10000, message = "La fiche de mission ne doit pas dépasser 10000 caractères")
    val ficheMission: String? = null
)
