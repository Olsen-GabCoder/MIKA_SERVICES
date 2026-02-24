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
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/messages")
@Tag(name = "Messagerie", description = "Gestion des messages internes")
class MessageController(
    private val messageService: MessageService
) {
    @PostMapping("/{expediteurId}")
    @Operation(summary = "Envoyer un message")
    fun envoyerMessage(
        @PathVariable expediteurId: Long,
        @Valid @RequestBody request: MessageCreateRequest
    ): ResponseEntity<MessageResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.envoyerMessage(expediteurId, request))
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

    @DeleteMapping("/{messageId}")
    @Operation(summary = "Supprimer un message")
    fun deleteMessage(@PathVariable messageId: Long): ResponseEntity<Map<String, String>> {
        messageService.deleteMessage(messageId)
        return ResponseEntity.ok(mapOf("message" to "Message supprimé avec succès"))
    }
}
