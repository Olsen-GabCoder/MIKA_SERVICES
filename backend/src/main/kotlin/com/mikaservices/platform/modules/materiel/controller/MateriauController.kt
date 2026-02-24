package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.modules.materiel.dto.request.AffectationMateriauRequest
import com.mikaservices.platform.modules.materiel.dto.request.MateriauCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.MateriauUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.AffectationMateriauResponse
import com.mikaservices.platform.modules.materiel.dto.response.MateriauResponse
import com.mikaservices.platform.modules.materiel.dto.response.MateriauSummaryResponse
import com.mikaservices.platform.modules.materiel.service.MateriauService
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
@RequestMapping("/materiaux")
@Tag(name = "Matériaux", description = "Gestion des matériaux et stocks")
class MateriauController(
    private val materiauService: MateriauService
) {
    @PostMapping
    @Operation(summary = "Créer un matériau")
    fun create(@Valid @RequestBody request: MateriauCreateRequest): ResponseEntity<MateriauResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(materiauService.create(request))
    }

    @GetMapping
    @Operation(summary = "Lister les matériaux")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<MateriauSummaryResponse>> {
        return ResponseEntity.ok(materiauService.findAll(pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un matériau par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<MateriauResponse> {
        return ResponseEntity.ok(materiauService.findById(id))
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des matériaux")
    fun search(@RequestParam q: String, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<MateriauSummaryResponse>> {
        return ResponseEntity.ok(materiauService.search(q, pageable))
    }

    @GetMapping("/stock-bas")
    @Operation(summary = "Lister les matériaux avec stock bas")
    fun findStockBas(): ResponseEntity<List<MateriauSummaryResponse>> {
        return ResponseEntity.ok(materiauService.findStockBas())
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un matériau")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: MateriauUpdateRequest): ResponseEntity<MateriauResponse> {
        return ResponseEntity.ok(materiauService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver un matériau")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        materiauService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Matériau désactivé avec succès"))
    }

    // ========== Affectations ==========
    @PostMapping("/affectations")
    @Operation(summary = "Affecter un matériau à un projet")
    fun affecterMateriau(@Valid @RequestBody request: AffectationMateriauRequest): ResponseEntity<AffectationMateriauResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(materiauService.affecterMateriau(request))
    }

    @GetMapping("/affectations/projet/{projetId}")
    @Operation(summary = "Lister les affectations de matériaux d'un projet")
    fun findAffectationsByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<AffectationMateriauResponse>> {
        return ResponseEntity.ok(materiauService.findAffectationsByProjet(projetId, pageable))
    }
}
