package com.mikaservices.platform.modules.communication.mapper

import com.mikaservices.platform.modules.communication.dto.response.MessageResponse
import com.mikaservices.platform.modules.communication.dto.response.NotificationResponse
import com.mikaservices.platform.modules.communication.dto.response.UserMinimalResponse
import com.mikaservices.platform.modules.communication.entity.Message
import com.mikaservices.platform.modules.communication.entity.Notification
import com.mikaservices.platform.modules.user.entity.User

object CommunicationMapper {

    fun toUserMinimal(user: User): UserMinimalResponse {
        return UserMinimalResponse(
            id = user.id!!,
            nom = user.nom,
            prenom = user.prenom,
            email = user.email
        )
    }

    fun toMessageResponse(entity: Message): MessageResponse {
        return MessageResponse(
            id = entity.id!!,
            expediteur = toUserMinimal(entity.expediteur),
            destinataire = toUserMinimal(entity.destinataire),
            sujet = entity.sujet,
            contenu = entity.contenu,
            dateEnvoi = entity.dateEnvoi,
            lu = entity.lu,
            dateLecture = entity.dateLecture,
            parentId = entity.parent?.id,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toNotificationResponse(entity: Notification): NotificationResponse {
        return NotificationResponse(
            id = entity.id!!,
            titre = entity.titre,
            contenu = entity.contenu,
            typeNotification = entity.typeNotification,
            lien = entity.lien,
            lu = entity.lu,
            dateCreation = entity.dateCreation,
            dateLecture = entity.dateLecture
        )
    }
}
