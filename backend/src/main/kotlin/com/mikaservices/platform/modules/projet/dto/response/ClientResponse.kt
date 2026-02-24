package com.mikaservices.platform.modules.projet.dto.response

import com.mikaservices.platform.common.enums.TypeClient
import java.time.LocalDateTime

data class ClientResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeClient,
    val ministere: String?,
    val telephone: String?,
    val email: String?,
    val adresse: String?,
    val contactPrincipal: String?,
    val telephoneContact: String?,
    val actif: Boolean,
    val createdAt: LocalDateTime?
)
