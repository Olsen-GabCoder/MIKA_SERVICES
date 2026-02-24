package com.mikaservices.platform.modules.user.dto.request

import com.mikaservices.platform.common.enums.NiveauExperience
import com.mikaservices.platform.common.enums.TypeContrat
import com.mikaservices.platform.common.validation.PasswordPolicy
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate

data class UserCreateRequest(
    @field:NotBlank(message = "Le matricule est obligatoire")
    @field:Size(max = 50, message = "Le matricule ne doit pas dépasser 50 caractères")
    val matricule: String,
    
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
    
    /** Mot de passe : non envoyé par le client ; généré côté serveur et envoyé par email de bienvenue. */
    @field:Pattern(
        regexp = PasswordPolicy.REGEX,
        message = PasswordPolicy.MESSAGE
    )
    val password: String? = null,
    
    @field:Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères")
    val telephone: String? = null,
    
    val dateNaissance: LocalDate? = null,
    
    @field:Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    val adresse: String? = null,
    
    @field:Size(max = 100, message = "La ville ne doit pas dépasser 100 caractères")
    val ville: String? = null,
    
    @field:Size(max = 100, message = "Le quartier ne doit pas dépasser 100 caractères")
    val quartier: String? = null,
    
    @field:Size(max = 100, message = "La province ne doit pas dépasser 100 caractères")
    val province: String? = null,
    
    @field:Size(max = 50, message = "Le numéro CNI ne doit pas dépasser 50 caractères")
    val numeroCNI: String? = null,
    
    @field:Size(max = 50, message = "Le numéro passeport ne doit pas dépasser 50 caractères")
    val numeroPasseport: String? = null,
    
    val dateEmbauche: LocalDate? = null,
    
    @field:Size(max = 500, message = "L'URL de la photo ne doit pas dépasser 500 caractères")
    val photo: String? = null,
    
    @field:DecimalMin(value = "0.0", message = "Le salaire mensuel doit être positif")
    val salaireMensuel: BigDecimal? = null,
    
    val typeContrat: TypeContrat? = null,
    
    val niveauExperience: NiveauExperience? = null,
    
    val roleIds: List<Long> = emptyList(),
    
    val departementIds: List<Long> = emptyList(),
    
    val specialiteIds: List<Long> = emptyList(),
    
    val superieurHierarchiqueId: Long? = null
)
