package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.projet.dto.request.DqeChapitreCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeChapitreUpdateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeLigneCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeLigneUpdateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeReorderItem
import com.mikaservices.platform.modules.projet.dto.response.DqeChapitreResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeLigneResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeSummaryResponse
import com.mikaservices.platform.modules.projet.service.DqeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/dqe")
@Tag(name = "DQE", description = "Gestion du Détail Quantitatif et Estimatif des projets")
class DqeController(
    private val dqeService: DqeService
) {

    // ── Chapitres ─────────────────────────────────────────────────────────

    @PostMapping("/chapitres")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Créer un chapitre DQE (chef de projet ou admin)")
    fun createChapitre(@Valid @RequestBody request: DqeChapitreCreateRequest): ResponseEntity<DqeChapitreResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(dqeService.createChapitre(request))
    }

    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Obtenir tous les chapitres DQE d'un projet (avec leurs lignes)")
    fun findByProjetId(@PathVariable projetId: Long): ResponseEntity<List<DqeChapitreResponse>> {
        return ResponseEntity.ok(dqeService.findChapitresByProjetId(projetId))
    }

    @GetMapping("/projet/{projetId}/summary")
    @Operation(summary = "Obtenir le résumé DQE d'un projet (totaux et avancement)")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<DqeSummaryResponse> {
        return ResponseEntity.ok(dqeService.getSummary(projetId))
    }

    @GetMapping("/chapitres/{id}")
    @Operation(summary = "Obtenir un chapitre DQE par ID")
    fun findChapitreById(@PathVariable id: Long): ResponseEntity<DqeChapitreResponse> {
        return ResponseEntity.ok(dqeService.findChapitreById(id))
    }

    @PutMapping("/chapitres/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Mettre à jour un chapitre DQE (chef de projet ou admin)")
    fun updateChapitre(@PathVariable id: Long, @Valid @RequestBody request: DqeChapitreUpdateRequest): ResponseEntity<DqeChapitreResponse> {
        return ResponseEntity.ok(dqeService.updateChapitre(id, request))
    }

    @DeleteMapping("/chapitres/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Supprimer un chapitre DQE et ses lignes (chef de projet ou admin)")
    fun deleteChapitre(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        dqeService.deleteChapitre(id)
        return ResponseEntity.ok(mapOf("message" to "Chapitre DQE supprimé avec succès"))
    }

    @PutMapping("/chapitres/reorder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Réordonner les chapitres DQE d'un projet")
    fun reorderChapitres(@RequestBody items: List<DqeReorderItem>): ResponseEntity<Map<String, String>> {
        dqeService.reorderChapitres(items)
        return ResponseEntity.ok(mapOf("message" to "Ordre des chapitres mis à jour"))
    }

    // ── Lignes ────────────────────────────────────────────────────────────

    @PostMapping("/lignes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Créer une ligne DQE (chef de projet ou admin)")
    fun createLigne(@Valid @RequestBody request: DqeLigneCreateRequest): ResponseEntity<DqeLigneResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(dqeService.createLigne(request))
    }

    @GetMapping("/chapitres/{chapitreId}/lignes")
    @Operation(summary = "Lister les lignes d'un chapitre DQE")
    fun findLignesByChapitre(@PathVariable chapitreId: Long): ResponseEntity<List<DqeLigneResponse>> {
        return ResponseEntity.ok(dqeService.findLignesByChapitreId(chapitreId))
    }

    @GetMapping("/lignes/{id}")
    @Operation(summary = "Obtenir une ligne DQE par ID")
    fun findLigneById(@PathVariable id: Long): ResponseEntity<DqeLigneResponse> {
        return ResponseEntity.ok(dqeService.findLigneById(id))
    }

    @PutMapping("/lignes/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Mettre à jour une ligne DQE (chef de projet ou admin)")
    fun updateLigne(@PathVariable id: Long, @Valid @RequestBody request: DqeLigneUpdateRequest): ResponseEntity<DqeLigneResponse> {
        return ResponseEntity.ok(dqeService.updateLigne(id, request))
    }

    @DeleteMapping("/lignes/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Supprimer une ligne DQE (chef de projet ou admin)")
    fun deleteLigne(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        dqeService.deleteLigne(id)
        return ResponseEntity.ok(mapOf("message" to "Ligne DQE supprimée avec succès"))
    }

    @PutMapping("/lignes/reorder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Réordonner les lignes DQE d'un chapitre")
    fun reorderLignes(@RequestBody items: List<DqeReorderItem>): ResponseEntity<Map<String, String>> {
        dqeService.reorderLignes(items)
        return ResponseEntity.ok(mapOf("message" to "Ordre des lignes mis à jour"))
    }
}
