package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.projet.dto.request.SousProjetCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.SousProjetUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.SousProjetResponse
import com.mikaservices.platform.modules.projet.service.SousProjetService
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
@RequestMapping("/sous-projets")
@Tag(name = "Sous-Projets", description = "Gestion des sous-projets")
class SousProjetController(
    private val sousProjetService: SousProjetService
) {

    @PostMapping
    @Operation(summary = "Créer un sous-projet")
    fun create(@Valid @RequestBody request: SousProjetCreateRequest): ResponseEntity<SousProjetResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(sousProjetService.create(request))
    }

    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Lister les sous-projets d'un projet")
    fun findByProjetId(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<SousProjetResponse>> {
        return ResponseEntity.ok(sousProjetService.findByProjetId(projetId, pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un sous-projet par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<SousProjetResponse> {
        return ResponseEntity.ok(sousProjetService.findById(id))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un sous-projet")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: SousProjetUpdateRequest): ResponseEntity<SousProjetResponse> {
        return ResponseEntity.ok(sousProjetService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un sous-projet")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        sousProjetService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Sous-projet supprimé avec succès"))
    }
}
