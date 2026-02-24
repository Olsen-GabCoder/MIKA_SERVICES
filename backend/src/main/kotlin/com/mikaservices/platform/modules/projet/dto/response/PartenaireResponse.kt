package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.TypePartenaire
import java.time.LocalDateTime

data class PartenaireResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypePartenaire,
    val pays: String?,
    val telephone: String?,
    val email: String?,
    val adresse: String?,
    val contactPrincipal: String?,
    val actif: Boolean,
    val createdAt: LocalDateTime?
)
