package com.mikaservices.platform.modules.communication.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.communication.dto.request.MessageCreateRequest
import com.mikaservices.platform.modules.communication.dto.response.MessageResponse
import com.mikaservices.platform.modules.communication.entity.Message
import com.mikaservices.platform.modules.communication.mapper.CommunicationMapper
import com.mikaservices.platform.modules.communication.repository.MessageRepository
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
class MessageService(
    private val messageRepository: MessageRepository,
    private val userRepository: UserRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val logger = LoggerFactory.getLogger(MessageService::class.java)

    fun envoyerMessage(expediteurId: Long, request: MessageCreateRequest): MessageResponse {
        val expediteur = userRepository.findById(expediteurId)
            .orElseThrow { ResourceNotFoundException("Expéditeur non trouvé avec l'ID: $expediteurId") }

        val destinataire = userRepository.findById(request.destinataireId)
            .orElseThrow { ResourceNotFoundException("Destinataire non trouvé avec l'ID: ${request.destinataireId}") }

        val parent = request.parentId?.let {
            messageRepository.findById(it).orElseThrow { ResourceNotFoundException("Message parent non trouvé avec l'ID: $it") }
        }

        val message = Message(
            expediteur = expediteur,
            destinataire = destinataire,
            sujet = request.sujet,
            contenu = request.contenu,
            parent = parent
        )

        val saved = messageRepository.save(message)
        val response = CommunicationMapper.toMessageResponse(saved)

        // Notification WebSocket temps réel
        messagingTemplate.convertAndSendToUser(
            request.destinataireId.toString(),
            "/queue/messages",
            response
        )

        logger.info("Message envoyé de ${expediteur.email} à ${destinataire.email}")
        return response
    }

    @Transactional(readOnly = true)
    fun getMessagesRecus(userId: Long, pageable: Pageable): Page<MessageResponse> {
        return messageRepository.findByDestinataire_IdOrderByDateEnvoiDesc(userId, pageable)
            .map { CommunicationMapper.toMessageResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getMessagesEnvoyes(userId: Long, pageable: Pageable): Page<MessageResponse> {
        return messageRepository.findByExpediteur_IdOrderByDateEnvoiDesc(userId, pageable)
            .map { CommunicationMapper.toMessageResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getConversation(userId1: Long, userId2: Long, pageable: Pageable): Page<MessageResponse> {
        return messageRepository.findConversation(userId1, userId2, pageable)
            .map { CommunicationMapper.toMessageResponse(it) }
    }

    fun marquerCommeLu(messageId: Long, userId: Long): MessageResponse {
        val message = messageRepository.findById(messageId)
            .orElseThrow { ResourceNotFoundException("Message non trouvé avec l'ID: $messageId") }

        if (message.destinataire.id == userId && !message.lu) {
            message.lu = true
            message.dateLecture = LocalDateTime.now()
            messageRepository.save(message)
        }

        return CommunicationMapper.toMessageResponse(message)
    }

    @Transactional(readOnly = true)
    fun countNonLus(userId: Long): Long {
        return messageRepository.countNonLus(userId)
    }

    fun deleteMessage(messageId: Long) {
        val message = messageRepository.findById(messageId)
            .orElseThrow { ResourceNotFoundException("Message non trouvé avec l'ID: $messageId") }
        messageRepository.delete(message)
        logger.info("Message supprimé: $messageId")
    }
}
