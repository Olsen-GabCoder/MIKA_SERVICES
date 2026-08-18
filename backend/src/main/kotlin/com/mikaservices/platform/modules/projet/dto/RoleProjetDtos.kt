package com.mikaservices.platform.modules.projet.dto

import com.mikaservices.platform.common.enums.FamilleRoleProjet
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RoleProjetRequest(
    @field:NotBlank(message = "Le nom du rôle est obligatoire")
    @field:Size(max = 100, message = "Le nom du rôle ne peut pas dépasser 100 caractères")
    val nom: String,

    val famille: FamilleRoleProjet,

    val cumulable: Boolean = false,

    @field:Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    val description: String? = null
)

data class RoleProjetResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val famille: FamilleRoleProjet,
    val cumulable: Boolean,
    val description: String?,
    val actif: Boolean
)
