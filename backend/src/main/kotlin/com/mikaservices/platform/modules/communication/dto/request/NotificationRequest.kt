package com.mikaservices.platform.modules.communication.dto.request

import com.mikaservices.platform.common.enums.TypeNotification
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class NotificationCreateRequest(
    @field:NotNull(message = "L'ID du destinataire est obligatoire")
    val destinataireId: Long,
    @field:NotBlank(message = "Le titre est obligatoire")
    val titre: String,
    val contenu: String? = null,
    @field:NotNull(message = "Le type de notification est obligatoire")
    val typeNotification: TypeNotification,
    val lien: String? = null
)
