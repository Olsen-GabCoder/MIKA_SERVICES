package com.mikaservices.platform.modules.communication.controller

import com.mikaservices.platform.modules.communication.dto.request.NotificationCreateRequest
import com.mikaservices.platform.modules.communication.dto.response.NotificationResponse
import com.mikaservices.platform.modules.communication.service.NotificationService
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
@RequestMapping("/notifications")
@Tag(name = "Notifications", description = "Gestion des notifications")
class NotificationController(
    private val notificationService: NotificationService
) {
    @PostMapping
    @Operation(summary = "Créer une notification")
    fun creerNotification(@Valid @RequestBody request: NotificationCreateRequest): ResponseEntity<NotificationResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.creerNotification(request))
    }

    @GetMapping("/mes-notifications/{userId}")
    @Operation(summary = "Toutes mes notifications")
    fun getMesNotifications(
        @PathVariable userId: Long,
        @PageableDefault(size = 30) pageable: Pageable
    ): ResponseEntity<Page<NotificationResponse>> {
        return ResponseEntity.ok(notificationService.getMesNotifications(userId, pageable))
    }

    @GetMapping("/non-lues/{userId}")
    @Operation(summary = "Notifications non lues")
    fun getNotificationsNonLues(@PathVariable userId: Long): ResponseEntity<List<NotificationResponse>> {
        return ResponseEntity.ok(notificationService.getNotificationsNonLues(userId))
    }

    @PutMapping("/{notificationId}/lu/{userId}")
    @Operation(summary = "Marquer une notification comme lue")
    fun marquerCommeLue(
        @PathVariable notificationId: Long,
        @PathVariable userId: Long
    ): ResponseEntity<NotificationResponse> {
        return ResponseEntity.ok(notificationService.marquerCommeLue(notificationId, userId))
    }

    @PutMapping("/tout-lu/{userId}")
    @Operation(summary = "Marquer toutes les notifications comme lues")
    fun marquerToutesLues(@PathVariable userId: Long): ResponseEntity<Map<String, Int>> {
        return ResponseEntity.ok(mapOf("count" to notificationService.marquerToutesLues(userId)))
    }

    @GetMapping("/count/{userId}")
    @Operation(summary = "Nombre de notifications non lues")
    fun countNonLues(@PathVariable userId: Long): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(mapOf("count" to notificationService.countNonLues(userId)))
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "Supprimer une notification")
    fun deleteNotification(@PathVariable notificationId: Long): ResponseEntity<Map<String, String>> {
        notificationService.deleteNotification(notificationId)
        return ResponseEntity.ok(mapOf("message" to "Notification supprimée avec succès"))
    }
}
