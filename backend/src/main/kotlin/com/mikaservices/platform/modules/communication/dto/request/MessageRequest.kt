package com.mikaservices.platform.modules.communication.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class MessageCreateRequest(
    @field:NotNull(message = "L'ID du destinataire est obligatoire")
    val destinataireId: Long,
    val sujet: String? = null,
    @field:NotBlank(message = "Le contenu est obligatoire")
    val contenu: String,
    val parentId: Long? = null,
    val mentionIds: List<Long>? = null
)
