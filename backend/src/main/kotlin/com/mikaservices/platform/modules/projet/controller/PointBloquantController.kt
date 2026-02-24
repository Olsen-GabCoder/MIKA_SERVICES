package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.modules.projet.dto.request.PointBloquantCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.PointBloquantUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.PointBloquantResponse
import com.mikaservices.platform.modules.projet.service.PointBloquantService
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
@RequestMapping("/points-bloquants")
@Tag(name = "Points Bloquants", description = "Gestion des points bloquants des projets")
class PointBloquantController(
    private val pointBloquantService: PointBloquantService
) {

    @PostMapping
    @Operation(summary = "Créer un point bloquant")
    fun create(@Valid @RequestBody request: PointBloquantCreateRequest): ResponseEntity<PointBloquantResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(pointBloquantService.create(request))
    }

    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Lister les points bloquants d'un projet")
    fun findByProjetId(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<PointBloquantResponse>> {
        return ResponseEntity.ok(pointBloquantService.findByProjetId(projetId, pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un point bloquant par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<PointBloquantResponse> {
        return ResponseEntity.ok(pointBloquantService.findById(id))
    }

    @GetMapping("/statut/{statut}")
    @Operation(summary = "Lister les points bloquants par statut")
    fun findByStatut(@PathVariable statut: StatutPointBloquant): ResponseEntity<List<PointBloquantResponse>> {
        return ResponseEntity.ok(pointBloquantService.findByStatut(statut))
    }

    @GetMapping("/assigne/{userId}")
    @Operation(summary = "Lister les points bloquants assignés à un utilisateur")
    fun findByAssigne(@PathVariable userId: Long): ResponseEntity<List<PointBloquantResponse>> {
        return ResponseEntity.ok(pointBloquantService.findByAssigne(userId))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un point bloquant")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: PointBloquantUpdateRequest): ResponseEntity<PointBloquantResponse> {
        return ResponseEntity.ok(pointBloquantService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un point bloquant")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        pointBloquantService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Point bloquant supprimé avec succès"))
    }
}
