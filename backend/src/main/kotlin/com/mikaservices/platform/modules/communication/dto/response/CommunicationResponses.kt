package com.mikaservices.platform.modules.communication.dto.response

import com.mikaservices.platform.common.enums.TypeNotification
import java.time.LocalDateTime

data class UserMinimalResponse(
    val id: Long,
    val nom: String,
    val prenom: String,
    val email: String
)

data class PieceJointeResponse(
    val id: Long,
    val nomOriginal: String,
    val typeMime: String?,
    val tailleOctets: Long
)

data class MessageResponse(
    val id: Long,
    val expediteur: UserMinimalResponse,
    val destinataire: UserMinimalResponse,
    val sujet: String?,
    val contenu: String,
    val dateEnvoi: LocalDateTime,
    val lu: Boolean,
    val dateLecture: LocalDateTime?,
    val parentId: Long?,
    val piecesJointes: List<PieceJointeResponse> = emptyList(),
    val mentions: List<UserMinimalResponse> = emptyList(),
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class NotificationResponse(
    val id: Long,
    val titre: String,
    val contenu: String?,
    val typeNotification: TypeNotification,
    val lien: String?,
    val lu: Boolean,
    val dateCreation: LocalDateTime,
    val dateLecture: LocalDateTime?
)

data class CommunicationCountResponse(
    val messagesNonLus: Long,
    val notificationsNonLues: Long
)
