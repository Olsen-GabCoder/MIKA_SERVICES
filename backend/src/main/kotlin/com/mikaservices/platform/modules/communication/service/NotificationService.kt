package com.mikaservices.platform.modules.communication.service

import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.communication.dto.request.NotificationCreateRequest
import com.mikaservices.platform.modules.communication.dto.response.NotificationResponse
import com.mikaservices.platform.modules.communication.entity.Notification
import com.mikaservices.platform.modules.communication.mapper.CommunicationMapper
import com.mikaservices.platform.modules.communication.repository.NotificationRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val userRepository: UserRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val logger = LoggerFactory.getLogger(NotificationService::class.java)

    fun creerNotification(request: NotificationCreateRequest): NotificationResponse {
        val destinataire = userRepository.findById(request.destinataireId)
            .orElseThrow { ResourceNotFoundException("Destinataire non trouvé avec l'ID: ${request.destinataireId}") }

        val notification = Notification(
            destinataire = destinataire,
            titre = request.titre,
            contenu = request.contenu,
            typeNotification = request.typeNotification,
            lien = request.lien
        )

        val saved = notificationRepository.save(notification)
        val response = CommunicationMapper.toNotificationResponse(saved)

        // Push WebSocket temps réel
        messagingTemplate.convertAndSendToUser(
            request.destinataireId.toString(),
            "/queue/notifications",
            response
        )

        logger.info("Notification envoyée à ${destinataire.email}: ${request.titre}")
        return response
    }

    /**
     * Méthode utilitaire pour envoyer une notification depuis d'autres services.
     */
    fun envoyerNotification(destinataireId: Long, titre: String, contenu: String?, type: TypeNotification, lien: String? = null) {
        val request = NotificationCreateRequest(
            destinataireId = destinataireId,
            titre = titre,
            contenu = contenu,
            typeNotification = type,
            lien = lien
        )
        creerNotification(request)
    }

    @Transactional(readOnly = true)
    fun getMesNotifications(userId: Long, pageable: Pageable): Page<NotificationResponse> {
        return notificationRepository.findByDestinataire_IdOrderByDateCreationDesc(userId, pageable)
            .map { CommunicationMapper.toNotificationResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getNotificationsNonLues(userId: Long): List<NotificationResponse> {
        return notificationRepository.findByDestinataire_IdAndLuFalseOrderByDateCreationDesc(userId)
            .map { CommunicationMapper.toNotificationResponse(it) }
    }

    fun marquerCommeLue(notificationId: Long, userId: Long): NotificationResponse {
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { ResourceNotFoundException("Notification non trouvée avec l'ID: $notificationId") }

        if (notification.destinataire.id == userId && !notification.lu) {
            notification.lu = true
            notification.dateLecture = LocalDateTime.now()
            notificationRepository.save(notification)
        }

        return CommunicationMapper.toNotificationResponse(notification)
    }

    fun marquerToutesLues(userId: Long): Int {
        val count = notificationRepository.marquerToutesLues(userId)
        logger.info("$count notifications marquées comme lues pour l'utilisateur $userId")
        return count
    }

    @Transactional(readOnly = true)
    fun countNonLues(userId: Long): Long {
        return notificationRepository.countNonLues(userId)
    }

    fun deleteNotification(notificationId: Long) {
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { ResourceNotFoundException("Notification non trouvée avec l'ID: $notificationId") }
        notificationRepository.delete(notification)
    }
}
