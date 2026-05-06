package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.projet.dto.request.DqeChapitreCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeChapitreUpdateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeLigneCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.DqeLigneUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.DqeChapitreResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeLigneResponse
import com.mikaservices.platform.modules.projet.dto.response.DqeSummaryResponse
import com.mikaservices.platform.modules.projet.service.DqeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/dqe")
@Tag(name = "DQE", description = "Gestion du Détail Quantitatif et Estimatif des projets")
class DqeController(
    private val dqeService: DqeService
) {

    // ── Chapitres ─────────────────────────────────────────────────────────

    @PostMapping("/chapitres")
    @Operation(summary = "Créer un chapitre DQE")
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
    @Operation(summary = "Mettre à jour un chapitre DQE")
    fun updateChapitre(@PathVariable id: Long, @Valid @RequestBody request: DqeChapitreUpdateRequest): ResponseEntity<DqeChapitreResponse> {
        return ResponseEntity.ok(dqeService.updateChapitre(id, request))
    }

    @DeleteMapping("/chapitres/{id}")
    @Operation(summary = "Supprimer un chapitre DQE (et toutes ses lignes)")
    fun deleteChapitre(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        dqeService.deleteChapitre(id)
        return ResponseEntity.ok(mapOf("message" to "Chapitre DQE supprimé avec succès"))
    }

    // ── Lignes ────────────────────────────────────────────────────────────

    @PostMapping("/lignes")
    @Operation(summary = "Créer une ligne DQE")
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
    @Operation(summary = "Mettre à jour une ligne DQE")
    fun updateLigne(@PathVariable id: Long, @Valid @RequestBody request: DqeLigneUpdateRequest): ResponseEntity<DqeLigneResponse> {
        return ResponseEntity.ok(dqeService.updateLigne(id, request))
    }

    @DeleteMapping("/lignes/{id}")
    @Operation(summary = "Supprimer une ligne DQE")
    fun deleteLigne(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        dqeService.deleteLigne(id)
        return ResponseEntity.ok(mapOf("message" to "Ligne DQE supprimée avec succès"))
    }
}
