package com.mikaservices.platform.modules.securite.controller

import com.mikaservices.platform.modules.securite.dto.request.*
import com.mikaservices.platform.modules.securite.dto.response.*
import com.mikaservices.platform.modules.securite.service.SecuriteService
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
@RequestMapping("/securite")
@Tag(name = "Sécurité & Prévention", description = "Gestion des incidents, risques et actions de prévention")
class SecuriteController(
    private val securiteService: SecuriteService
) {
    // ==================== INCIDENTS ====================

    @PostMapping("/incidents")
    @Operation(summary = "Déclarer un incident")
    fun createIncident(@Valid @RequestBody request: IncidentCreateRequest): ResponseEntity<IncidentResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(securiteService.createIncident(request))
    }

    @GetMapping("/incidents/projet/{projetId}")
    @Operation(summary = "Lister les incidents d'un projet")
    fun findIncidentsByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<IncidentResponse>> {
        return ResponseEntity.ok(securiteService.findIncidentsByProjet(projetId, pageable))
    }

    @GetMapping("/incidents/{id}")
    @Operation(summary = "Obtenir un incident par ID")
    fun findIncidentById(@PathVariable id: Long): ResponseEntity<IncidentResponse> {
        return ResponseEntity.ok(securiteService.findIncidentById(id))
    }

    @PutMapping("/incidents/{id}")
    @Operation(summary = "Mettre à jour un incident")
    fun updateIncident(@PathVariable id: Long, @Valid @RequestBody request: IncidentUpdateRequest): ResponseEntity<IncidentResponse> {
        return ResponseEntity.ok(securiteService.updateIncident(id, request))
    }

    @DeleteMapping("/incidents/{id}")
    @Operation(summary = "Supprimer un incident")
    fun deleteIncident(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        securiteService.deleteIncident(id)
        return ResponseEntity.ok(mapOf("message" to "Incident supprimé avec succès"))
    }

    // ==================== RISQUES ====================

    @PostMapping("/risques")
    @Operation(summary = "Créer un risque")
    fun createRisque(@Valid @RequestBody request: RisqueCreateRequest): ResponseEntity<RisqueResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(securiteService.createRisque(request))
    }

    @GetMapping("/risques/projet/{projetId}")
    @Operation(summary = "Lister les risques d'un projet")
    fun findRisquesByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<RisqueResponse>> {
        return ResponseEntity.ok(securiteService.findRisquesByProjet(projetId, pageable))
    }

    @GetMapping("/risques/{id}")
    @Operation(summary = "Obtenir un risque par ID")
    fun findRisqueById(@PathVariable id: Long): ResponseEntity<RisqueResponse> {
        return ResponseEntity.ok(securiteService.findRisqueById(id))
    }

    @PutMapping("/risques/{id}")
    @Operation(summary = "Mettre à jour un risque")
    fun updateRisque(@PathVariable id: Long, @Valid @RequestBody request: RisqueUpdateRequest): ResponseEntity<RisqueResponse> {
        return ResponseEntity.ok(securiteService.updateRisque(id, request))
    }

    @DeleteMapping("/risques/{id}")
    @Operation(summary = "Supprimer un risque")
    fun deleteRisque(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        securiteService.deleteRisque(id)
        return ResponseEntity.ok(mapOf("message" to "Risque supprimé avec succès"))
    }

    // ==================== ACTIONS PRÉVENTION ====================

    @PostMapping("/actions")
    @Operation(summary = "Créer une action de prévention")
    fun createAction(@Valid @RequestBody request: ActionPreventionCreateRequest): ResponseEntity<ActionPreventionResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(securiteService.createAction(request))
    }

    @GetMapping("/actions/incident/{incidentId}")
    @Operation(summary = "Lister les actions d'un incident")
    fun findActionsByIncident(@PathVariable incidentId: Long): ResponseEntity<List<ActionPreventionResponse>> {
        return ResponseEntity.ok(securiteService.findActionsByIncident(incidentId))
    }

    @GetMapping("/actions/en-retard")
    @Operation(summary = "Lister les actions en retard")
    fun findActionsEnRetard(): ResponseEntity<List<ActionPreventionResponse>> {
        return ResponseEntity.ok(securiteService.findActionsEnRetard())
    }

    @PutMapping("/actions/{id}")
    @Operation(summary = "Mettre à jour une action de prévention")
    fun updateAction(@PathVariable id: Long, @Valid @RequestBody request: ActionPreventionUpdateRequest): ResponseEntity<ActionPreventionResponse> {
        return ResponseEntity.ok(securiteService.updateAction(id, request))
    }

    @DeleteMapping("/actions/{id}")
    @Operation(summary = "Supprimer une action de prévention")
    fun deleteAction(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        securiteService.deleteAction(id)
        return ResponseEntity.ok(mapOf("message" to "Action de prévention supprimée avec succès"))
    }

    // ==================== TABLEAU DE BORD ====================

    @GetMapping("/summary/projet/{projetId}")
    @Operation(summary = "Tableau de bord sécurité d'un projet")
    fun getSecuriteSummary(@PathVariable projetId: Long): ResponseEntity<SecuriteSummaryResponse> {
        return ResponseEntity.ok(securiteService.getSecuriteSummary(projetId))
    }
}
