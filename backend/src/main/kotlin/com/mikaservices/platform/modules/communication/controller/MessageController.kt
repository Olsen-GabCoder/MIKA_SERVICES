package com.mikaservices.platform.modules.communication.controller

import com.mikaservices.platform.modules.communication.dto.request.MessageCreateRequest
import com.mikaservices.platform.modules.communication.dto.response.MessageResponse
import com.mikaservices.platform.modules.communication.service.MessageService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/messages")
@Tag(name = "Messagerie", description = "Gestion des messages internes")
class MessageController(
    private val messageService: MessageService
) {
    @PostMapping("/{expediteurId}")
    @Operation(summary = "Envoyer un message (JSON uniquement)")
    fun envoyerMessage(
        @PathVariable expediteurId: Long,
        @Valid @RequestBody request: MessageCreateRequest
    ): ResponseEntity<MessageResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.envoyerMessage(expediteurId, request))
    }

    @PostMapping(value = ["/{expediteurId}/with-attachments"], consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Envoyer un message avec pièces jointes")
    fun envoyerMessageAvecPiecesJointes(
        @PathVariable expediteurId: Long,
        @RequestPart("request") @Valid request: MessageCreateRequest,
        @RequestPart(value = "files", required = false) files: List<MultipartFile>?
    ): ResponseEntity<MessageResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.envoyerMessage(expediteurId, request, files))
    }

    @GetMapping("/recus/{userId}")
    @Operation(summary = "Messages reçus d'un utilisateur")
    fun getMessagesRecus(
        @PathVariable userId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<MessageResponse>> {
        return ResponseEntity.ok(messageService.getMessagesRecus(userId, pageable))
    }

    @GetMapping("/envoyes/{userId}")
    @Operation(summary = "Messages envoyés par un utilisateur")
    fun getMessagesEnvoyes(
        @PathVariable userId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<MessageResponse>> {
        return ResponseEntity.ok(messageService.getMessagesEnvoyes(userId, pageable))
    }

    @GetMapping("/conversation/{userId1}/{userId2}")
    @Operation(summary = "Conversation entre deux utilisateurs")
    fun getConversation(
        @PathVariable userId1: Long,
        @PathVariable userId2: Long,
        @PageableDefault(size = 50) pageable: Pageable
    ): ResponseEntity<Page<MessageResponse>> {
        return ResponseEntity.ok(messageService.getConversation(userId1, userId2, pageable))
    }

    @PutMapping("/{messageId}/lu/{userId}")
    @Operation(summary = "Marquer un message comme lu")
    fun marquerCommeLu(
        @PathVariable messageId: Long,
        @PathVariable userId: Long
    ): ResponseEntity<MessageResponse> {
        return ResponseEntity.ok(messageService.marquerCommeLu(messageId, userId))
    }

    @GetMapping("/non-lus/{userId}")
    @Operation(summary = "Nombre de messages non lus")
    fun countNonLus(@PathVariable userId: Long): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(mapOf("count" to messageService.countNonLus(userId)))
    }

    @PostMapping("/archive")
    @Operation(summary = "Archiver une conversation")
    fun archiveConversation(
        @RequestParam userId: Long,
        @RequestParam peerUserId: Long
    ): ResponseEntity<Map<String, String>> {
        messageService.archiveConversation(userId, peerUserId)
        return ResponseEntity.ok(mapOf("message" to "Conversation archivée"))
    }

    @PostMapping("/unarchive")
    @Operation(summary = "Désarchiver une conversation")
    fun unarchiveConversation(
        @RequestParam userId: Long,
        @RequestParam peerUserId: Long
    ): ResponseEntity<Map<String, String>> {
        messageService.unarchiveConversation(userId, peerUserId)
        return ResponseEntity.ok(mapOf("message" to "Conversation désarchivée"))
    }

    @GetMapping("/archived-peers/{userId}")
    @Operation(summary = "Liste des IDs des interlocuteurs archivés")
    fun getArchivedPeerIds(@PathVariable userId: Long): ResponseEntity<List<Long>> {
        return ResponseEntity.ok(messageService.getArchivedPeerIds(userId))
    }

    @PostMapping("/{messageId}/suppress-for-me")
    @Operation(summary = "Masquer un message pour moi (suppression côté utilisateur)")
    fun suppressMessageForMe(
        @PathVariable messageId: Long,
        @RequestParam userId: Long
    ): ResponseEntity<Map<String, String>> {
        messageService.suppressMessageForUser(userId, messageId)
        return ResponseEntity.ok(mapOf("message" to "Message masqué"))
    }

    @DeleteMapping("/{messageId}")
    @Operation(summary = "Supprimer un message")
    fun deleteMessage(@PathVariable messageId: Long): ResponseEntity<Map<String, String>> {
        messageService.deleteMessage(messageId)
        return ResponseEntity.ok(mapOf("message" to "Message supprimé avec succès"))
    }

    @GetMapping("/pieces-jointes/{pieceJointeId}/download")
    @Operation(summary = "Télécharger une pièce jointe")
    fun downloadPieceJointe(
        @PathVariable pieceJointeId: Long,
        @RequestParam userId: Long
    ): ResponseEntity<org.springframework.core.io.Resource> {
        val (resource, nomOriginal) = messageService.downloadPieceJointe(pieceJointeId, userId)
        val filename = nomOriginal.replace(Regex("[\"\\\\]"), "_")
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .body(resource)
    }
}
