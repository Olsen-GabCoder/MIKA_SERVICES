package com.mikaservices.platform.modules.sallereunion.controller

import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.modules.sallereunion.dto.JaaSTokenResponse
import com.mikaservices.platform.modules.sallereunion.dto.JitsiConfigResponse
import com.mikaservices.platform.modules.sallereunion.dto.SalleParticipantResponse
import com.mikaservices.platform.modules.sallereunion.dto.SalleReunionResponse
import com.mikaservices.platform.modules.sallereunion.service.JaaSTokenService
import com.mikaservices.platform.modules.sallereunion.service.SalleParticipantService
import com.mikaservices.platform.modules.sallereunion.service.SalleReunionService
import com.mikaservices.platform.modules.user.service.CurrentUserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/salle-reunion")
@Tag(name = "Salle de reunion", description = "Gestion de la salle visio MIKA (Jitsi/JaaS)")
class SalleReunionController(
    private val salleReunionService: SalleReunionService,
    private val jaaSTokenService: JaaSTokenService,
    private val currentUserService: CurrentUserService,
    private val salleParticipantService: SalleParticipantService,
) {

    /** Retourne l'etat courant de la salle (ouvert/ferme, qui a ouvert, quand). */
    @GetMapping
    @Operation(summary = "Obtenir l'etat de la salle MIKA")
    fun getSalle(): ResponseEntity<SalleReunionResponse> {
        return ResponseEntity.ok(salleReunionService.getSalle())
    }

    /** Retourne la config Jitsi pour l'utilisateur courant (roomName, displayName, subject). */
    @GetMapping("/jitsi-config")
    @Operation(summary = "Obtenir la configuration Jitsi pour rejoindre la salle (legacy)")
    fun getJitsiConfig(): ResponseEntity<JitsiConfigResponse> {
        return ResponseEntity.ok(salleReunionService.getJitsiConfig())
    }

    /** Genere un JWT JaaS pour l'utilisateur courant, permettant de rejoindre la salle sans auth externe. */
    @GetMapping("/jaas-token")
    @Operation(summary = "Obtenir un JWT JaaS pour rejoindre la salle (authentification automatique)")
    fun getJaaSToken(): ResponseEntity<JaaSTokenResponse> {
        if (!jaaSTokenService.isEnabled()) {
            throw BadRequestException("JaaS n'est pas configure sur ce serveur")
        }
        val user = currentUserService.getCurrentUser()
            ?: throw IllegalStateException("Aucun utilisateur authentifie")

        val isAdmin = user.roles.any { it.code == "ADMIN" || it.code == "SUPER_ADMIN" }
        val salle = salleReunionService.getSalleEntity()
        if (!salle.ouverte) {
            throw BadRequestException("La salle est fermée")
        }
        val token = jaaSTokenService.generateToken(user, isAdmin, salle.roomName)

        return ResponseEntity.ok(
            JaaSTokenResponse(
                token = token,
                appId = jaaSTokenService.getAppId(),
                roomName = salle.roomName,
                displayName = "${user.prenom} ${user.nom}",
                subject = salle.libelle,
                moderator = isAdmin,
            )
        )
    }

    /** Ouvre la salle MIKA. Reserve aux administrateurs. */
    @PostMapping("/ouvrir")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Ouvrir la salle MIKA (admin uniquement)")
    fun ouvrirSalle(): ResponseEntity<SalleReunionResponse> {
        return ResponseEntity.ok(salleReunionService.ouvrirSalle())
    }

    /** Ferme la salle MIKA. Reserve aux administrateurs. */
    @PostMapping("/fermer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Fermer la salle MIKA (admin uniquement)")
    fun fermerSalle(): ResponseEntity<SalleReunionResponse> {
        return ResponseEntity.ok(salleReunionService.fermerSalle())
    }

    // ── Participants ─────────────────────────────────────────────────

    @PostMapping("/participants/join")
    @Operation(summary = "Signaler que l'utilisateur rejoint la salle")
    fun joinParticipant(): ResponseEntity<SalleParticipantResponse> {
        return ResponseEntity.ok(salleParticipantService.join())
    }

    @PostMapping("/participants/leave")
    @Operation(summary = "Signaler que l'utilisateur quitte la salle")
    fun leaveParticipant(): ResponseEntity<Void> {
        salleParticipantService.leave()
        return ResponseEntity.ok().build()
    }

    @PostMapping("/participants/heartbeat")
    @Operation(summary = "Heartbeat de presence dans la salle")
    fun heartbeat(): ResponseEntity<Void> {
        salleParticipantService.heartbeat()
        return ResponseEntity.ok().build()
    }

    @GetMapping("/participants/online")
    @Operation(summary = "Liste des participants actuellement dans la salle")
    fun getOnlineParticipants(): ResponseEntity<List<SalleParticipantResponse>> {
        return ResponseEntity.ok(salleParticipantService.getOnlineParticipants())
    }

    @GetMapping("/participants/count-since")
    @Operation(summary = "Nombre de participants distincts depuis une date")
    fun countParticipantsSince(
        @org.springframework.web.bind.annotation.RequestParam since: String
    ): ResponseEntity<Map<String, Long>> {
        val sinceDate = try {
            java.time.LocalDateTime.parse(since)
        } catch (e: java.time.format.DateTimeParseException) {
            throw BadRequestException("Format de date invalide. Attendu : ISO-8601 (ex: 2025-01-15T10:30:00)")
        }
        val count = salleParticipantService.countDistinctParticipantsSince(sinceDate)
        return ResponseEntity.ok(mapOf("count" to count))
    }
}
