package com.mikaservices.platform.modules.planning.controller

import com.mikaservices.platform.modules.planning.dto.request.TacheCreateRequest
import com.mikaservices.platform.modules.planning.dto.request.TacheUpdateRequest
import com.mikaservices.platform.modules.planning.dto.response.TacheResponse
import com.mikaservices.platform.modules.planning.service.PlanningService
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
@RequestMapping("/planning")
@Tag(name = "Planning", description = "Gestion du planning et des tâches")
class PlanningController(
    private val planningService: PlanningService
) {
    @PostMapping("/taches")
    @Operation(summary = "Créer une tâche")
    fun createTache(@Valid @RequestBody request: TacheCreateRequest): ResponseEntity<TacheResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(planningService.createTache(request))
    }

    @GetMapping("/taches/projet/{projetId}")
    @Operation(summary = "Lister les tâches d'un projet")
    fun findByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<TacheResponse>> {
        return ResponseEntity.ok(planningService.findByProjet(projetId, pageable))
    }

    @GetMapping("/taches/{id}")
    @Operation(summary = "Obtenir une tâche par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<TacheResponse> {
        return ResponseEntity.ok(planningService.findById(id))
    }

    @GetMapping("/taches/mes-taches/{userId}")
    @Operation(summary = "Lister les tâches en cours d'un utilisateur")
    fun findMesTaches(@PathVariable userId: Long): ResponseEntity<List<TacheResponse>> {
        return ResponseEntity.ok(planningService.findMesTaches(userId))
    }

    @GetMapping("/taches/en-retard")
    @Operation(summary = "Lister les tâches en retard")
    fun findTachesEnRetard(): ResponseEntity<List<TacheResponse>> {
        return ResponseEntity.ok(planningService.findTachesEnRetard())
    }

    @PutMapping("/taches/{id}")
    @Operation(summary = "Mettre à jour une tâche")
    fun updateTache(@PathVariable id: Long, @Valid @RequestBody request: TacheUpdateRequest): ResponseEntity<TacheResponse> {
        return ResponseEntity.ok(planningService.updateTache(id, request))
    }

    @DeleteMapping("/taches/{id}")
    @Operation(summary = "Supprimer une tâche")
    fun deleteTache(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        planningService.deleteTache(id)
        return ResponseEntity.ok(mapOf("message" to "Tâche supprimée avec succès"))
    }
}
