package com.mikaservices.platform.modules.communication.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.config.mail.EmailService
import com.mikaservices.platform.modules.communication.dto.request.MessageCreateRequest
import com.mikaservices.platform.modules.communication.dto.response.MessageResponse
import com.mikaservices.platform.modules.communication.entity.ConversationArchive
import com.mikaservices.platform.modules.communication.entity.Message
import com.mikaservices.platform.modules.communication.entity.MessageMention
import com.mikaservices.platform.modules.communication.entity.MessagePieceJointe
import com.mikaservices.platform.modules.communication.entity.MessageSuppression
import com.mikaservices.platform.modules.communication.mapper.CommunicationMapper
import com.mikaservices.platform.modules.communication.repository.ConversationArchiveRepository
import com.mikaservices.platform.modules.communication.repository.MessagePieceJointeRepository
import com.mikaservices.platform.modules.communication.repository.MessageMentionRepository
import com.mikaservices.platform.modules.communication.repository.MessageRepository
import com.mikaservices.platform.modules.communication.repository.MessageSuppressionRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.util.UUID

@Service
@Transactional
class MessageService(
    private val messageRepository: MessageRepository,
    private val messagePieceJointeRepository: MessagePieceJointeRepository,
    private val messageMentionRepository: MessageMentionRepository,
    private val conversationArchiveRepository: ConversationArchiveRepository,
    private val messageSuppressionRepository: MessageSuppressionRepository,
    private val userRepository: UserRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val emailService: EmailService
) {
    @Value("\${app.upload.dir:uploads}")
    private lateinit var uploadDir: String

    private val logger = LoggerFactory.getLogger(MessageService::class.java)

    fun envoyerMessage(expediteurId: Long, request: MessageCreateRequest, files: List<MultipartFile>? = null): MessageResponse {
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

        request.mentionIds?.filter { it != expediteurId && it != request.destinataireId }?.distinct()?.forEach { mentionUserId ->
            userRepository.findById(mentionUserId).ifPresent { mentionedUser ->
                val mention = MessageMention(message = saved, user = mentionedUser)
                messageMentionRepository.save(mention)
            }
        }

        if (!files.isNullOrEmpty()) {
            val messagesDir = Paths.get(uploadDir).resolve("messages").toAbsolutePath().normalize()
            Files.createDirectories(messagesDir)
            if (!messagesDir.startsWith(Paths.get(uploadDir).toAbsolutePath())) {
                throw IllegalArgumentException("Chemin de stockage invalide")
            }
            for (file in files) {
                if (file.isEmpty) continue
                val nomOriginal = file.originalFilename ?: "fichier"
                val ext = nomOriginal.substringAfterLast(".", "").takeIf { it.isNotBlank() }?.let { ".$it" } ?: ""
                val nomStockage = "${UUID.randomUUID()}${ext}"
                val targetPath = messagesDir.resolve(nomStockage)
                Files.copy(file.inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING)
                val pj = MessagePieceJointe(
                    message = saved,
                    nomOriginal = nomOriginal,
                    nomStockage = nomStockage,
                    cheminStockage = targetPath.toString(),
                    typeMime = file.contentType,
                    tailleOctets = file.size
                )
                messagePieceJointeRepository.save(pj)
                logger.debug("Pièce jointe enregistrée: $nomOriginal pour message ${saved.id}")
            }
        }

        val piecesJointes = messagePieceJointeRepository.findByMessageIdOrderByIdAsc(saved.id!!)
        val mentions = messageMentionRepository.findByMessageId(saved.id!!).map { CommunicationMapper.toUserMinimal(it.user) }
        val response = CommunicationMapper.toMessageResponse(saved, piecesJointes, mentions)

        // Notification WebSocket temps réel
        messagingTemplate.convertAndSendToUser(
            request.destinataireId.toString(),
            "/queue/messages",
            response
        )

        // E-mail si le destinataire a activé les notifications par e-mail
        if (destinataire.emailNotificationsEnabled) {
            val expediteurNom = "${expediteur.prenom} ${expediteur.nom}"
            emailService.sendNewMessageEmail(
                destinataire.email,
                destinataire.prenom,
                expediteurNom,
                request.sujet,
                request.contenu.take(300)
            )
        }

        logger.info("Message envoyé de ${expediteur.email} à ${destinataire.email}")
        return response
    }

    private fun toMessageResponseWithPieces(message: Message): MessageResponse {
        val pieces = messagePieceJointeRepository.findByMessageIdOrderByIdAsc(message.id!!)
        val mentions = messageMentionRepository.findByMessageId(message.id!!).map { CommunicationMapper.toUserMinimal(it.user) }
        return CommunicationMapper.toMessageResponse(message, pieces, mentions)
    }

    @Transactional(readOnly = true)
    fun getMessagesRecus(userId: Long, pageable: Pageable): Page<MessageResponse> {
        val archivedPeerIds = conversationArchiveRepository.findPeerUserIdsArchivedByUser(userId)
        val suppressedMessageIds = messageSuppressionRepository.findMessageIdsSuppressedByUser(userId)
        val excludedPeers = if (archivedPeerIds.isEmpty()) listOf(-1L) else archivedPeerIds
        val excludedMsgs = if (suppressedMessageIds.isEmpty()) listOf(-1L) else suppressedMessageIds
        val page = messageRepository.findRecusExcluding(userId, excludedPeers, excludedMsgs, pageable)
        val messageIds = page.content.map { it.id!! }
        val piecesByMessage = if (messageIds.isEmpty()) emptyMap() else
            messagePieceJointeRepository.findByMessageIdInOrderByMessageIdAscIdAsc(messageIds)
                .groupBy { it.message.id!! }
        val mentionsByMessage = if (messageIds.isEmpty()) emptyMap() else
            messageMentionRepository.findByMessageIdIn(messageIds).groupBy { it.message.id!! }
                .mapValues { (_, list) -> list.map { CommunicationMapper.toUserMinimal(it.user) } }
        return page.map { msg ->
            CommunicationMapper.toMessageResponse(msg, piecesByMessage[msg.id!!] ?: emptyList(), mentionsByMessage[msg.id!!] ?: emptyList())
        }
    }

    @Transactional(readOnly = true)
    fun getMessagesEnvoyes(userId: Long, pageable: Pageable): Page<MessageResponse> {
        val archivedPeerIds = conversationArchiveRepository.findPeerUserIdsArchivedByUser(userId)
        val suppressedMessageIds = messageSuppressionRepository.findMessageIdsSuppressedByUser(userId)
        val excludedPeers = if (archivedPeerIds.isEmpty()) listOf(-1L) else archivedPeerIds
        val excludedMsgs = if (suppressedMessageIds.isEmpty()) listOf(-1L) else suppressedMessageIds
        val page = messageRepository.findEnvoyesExcluding(userId, excludedPeers, excludedMsgs, pageable)
        val messageIds = page.content.map { it.id!! }
        val piecesByMessage = if (messageIds.isEmpty()) emptyMap() else
            messagePieceJointeRepository.findByMessageIdInOrderByMessageIdAscIdAsc(messageIds)
                .groupBy { it.message.id!! }
        val mentionsByMessage = if (messageIds.isEmpty()) emptyMap() else
            messageMentionRepository.findByMessageIdIn(messageIds).groupBy { it.message.id!! }
                .mapValues { (_, list) -> list.map { CommunicationMapper.toUserMinimal(it.user) } }
        return page.map { msg ->
            CommunicationMapper.toMessageResponse(msg, piecesByMessage[msg.id!!] ?: emptyList(), mentionsByMessage[msg.id!!] ?: emptyList())
        }
    }

    fun suppressMessageForUser(userId: Long, messageId: Long) {
        val user = userRepository.findById(userId).orElseThrow { ResourceNotFoundException("Utilisateur non trouvé: $userId") }
        val message = messageRepository.findById(messageId).orElseThrow { ResourceNotFoundException("Message non trouvé: $messageId") }
        if (message.expediteur.id != userId && message.destinataire.id != userId) {
            throw ResourceNotFoundException("Vous ne pouvez pas masquer ce message")
        }
        if (messageSuppressionRepository.existsByUser_IdAndMessage_Id(userId, messageId)) return
        val suppression = MessageSuppression(user = user, message = message)
        messageSuppressionRepository.save(suppression)
        logger.info("Message masqué pour l'utilisateur: user=$userId message=$messageId")
    }

    fun archiveConversation(userId: Long, peerUserId: Long) {
        val user = userRepository.findById(userId).orElseThrow { ResourceNotFoundException("Utilisateur non trouvé: $userId") }
        if (conversationArchiveRepository.existsByUser_IdAndPeerUserId(userId, peerUserId)) return
        val archive = ConversationArchive(user = user, peerUserId = peerUserId)
        conversationArchiveRepository.save(archive)
        logger.info("Conversation archivée: user=$userId peer=$peerUserId")
    }

    fun unarchiveConversation(userId: Long, peerUserId: Long) {
        val existing = conversationArchiveRepository.findByUser_IdAndPeerUserId(userId, peerUserId)
        existing?.let { conversationArchiveRepository.delete(it); logger.info("Conversation désarchivée: user=$userId peer=$peerUserId") }
    }

    @Transactional(readOnly = true)
    fun getArchivedPeerIds(userId: Long): List<Long> = conversationArchiveRepository.findPeerUserIdsArchivedByUser(userId)

    @Transactional(readOnly = true)
    fun getConversation(userId1: Long, userId2: Long, pageable: Pageable): Page<MessageResponse> {
        val page = messageRepository.findConversation(userId1, userId2, pageable)
        val messageIds = page.content.map { it.id!! }
        val piecesByMessage = if (messageIds.isEmpty()) emptyMap() else
            messagePieceJointeRepository.findByMessageIdInOrderByMessageIdAscIdAsc(messageIds)
                .groupBy { it.message.id!! }
        val mentionsByMessage = if (messageIds.isEmpty()) emptyMap() else
            messageMentionRepository.findByMessageIdIn(messageIds).groupBy { it.message.id!! }
                .mapValues { (_, list) -> list.map { CommunicationMapper.toUserMinimal(it.user) } }
        return page.map { msg ->
            CommunicationMapper.toMessageResponse(msg, piecesByMessage[msg.id!!] ?: emptyList(), mentionsByMessage[msg.id!!] ?: emptyList())
        }
    }

    fun marquerCommeLu(messageId: Long, userId: Long): MessageResponse {
        val message = messageRepository.findById(messageId)
            .orElseThrow { ResourceNotFoundException("Message non trouvé avec l'ID: $messageId") }

        if (message.destinataire.id == userId && !message.lu) {
            message.lu = true
            message.dateLecture = LocalDateTime.now()
            messageRepository.save(message)
        }

        return toMessageResponseWithPieces(message)
    }

    @Transactional(readOnly = true)
    fun downloadPieceJointe(pieceJointeId: Long, userId: Long): Pair<Resource, String> {
        val pj = messagePieceJointeRepository.findById(pieceJointeId)
            .orElseThrow { ResourceNotFoundException("Pièce jointe non trouvée avec l'ID: $pieceJointeId") }
        val message = pj.message
        if (message.expediteur.id != userId && message.destinataire.id != userId) {
            throw ResourceNotFoundException("Accès non autorisé à cette pièce jointe")
        }
        val path = Paths.get(pj.cheminStockage)
        if (!Files.exists(path)) throw ResourceNotFoundException("Fichier introuvable sur le serveur")
        val resource = UrlResource(path.toUri())
        return Pair(resource, pj.nomOriginal)
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
