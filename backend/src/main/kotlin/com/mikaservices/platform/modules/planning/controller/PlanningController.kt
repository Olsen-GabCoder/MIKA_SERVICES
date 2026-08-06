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
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/planning")
@Tag(name = "Planning", description = "Gestion du planning et des tâches")
class PlanningController(
    private val planningService: PlanningService
) {
    @PostMapping("/taches")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Créer une tâche (chef de projet ou admin)")
    fun createTache(@Valid @RequestBody request: TacheCreateRequest): ResponseEntity<TacheResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(planningService.createTache(request))
    }

    @GetMapping("/taches/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les tâches d'un projet")
    fun findByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<TacheResponse>> {
        return ResponseEntity.ok(planningService.findByProjet(projetId, pageable))
    }

    @GetMapping("/taches/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtenir une tâche par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<TacheResponse> {
        return ResponseEntity.ok(planningService.findById(id))
    }

    @GetMapping("/taches/mes-taches/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les tâches en cours d'un utilisateur (propres tâches ou admin)")
    fun findMesTaches(@PathVariable userId: Long): ResponseEntity<List<TacheResponse>> {
        return ResponseEntity.ok(planningService.findMesTaches(userId))
    }

    @GetMapping("/taches/en-retard")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les tâches en retard (filtrées par accès utilisateur)")
    fun findTachesEnRetard(): ResponseEntity<List<TacheResponse>> {
        return ResponseEntity.ok(planningService.findTachesEnRetard())
    }

    @GetMapping("/taches/projet/{projetId}/all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister toutes les tâches d'un projet (sans pagination)")
    fun findAllByProjet(@PathVariable projetId: Long): ResponseEntity<List<TacheResponse>> {
        return ResponseEntity.ok(planningService.findAllByProjet(projetId))
    }

    @GetMapping("/taches/projet/{projetId}/previsions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les prévisions (tâches avec typePrevision) d'un projet")
    fun findPrevisionsByProjet(
        @PathVariable projetId: Long,
        @RequestParam(required = false) annee: Int?,
        @RequestParam(required = false) semaine: Int?
    ): ResponseEntity<List<TacheResponse>> {
        val result = when {
            annee != null && semaine != null -> planningService.findPrevisionsByProjetAndSemaineAndAnnee(projetId, semaine, annee)
            annee != null -> planningService.findPrevisionsByProjetAndAnnee(projetId, annee)
            else -> planningService.findPrevisionsByProjet(projetId)
        }
        return ResponseEntity.ok(result)
    }

    @PutMapping("/taches/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Mettre à jour une tâche (chef de projet ou admin)")
    fun updateTache(@PathVariable id: Long, @Valid @RequestBody request: TacheUpdateRequest): ResponseEntity<TacheResponse> {
        return ResponseEntity.ok(planningService.updateTache(id, request))
    }

    @DeleteMapping("/taches/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Supprimer une tâche (chef de projet ou admin)")
    fun deleteTache(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        planningService.deleteTache(id)
        return ResponseEntity.ok(mapOf("message" to "Tâche supprimée avec succès"))
    }
}
