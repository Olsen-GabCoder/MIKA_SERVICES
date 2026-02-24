package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.AffectationEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginSummaryResponse
import com.mikaservices.platform.modules.materiel.service.EnginService
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
@RequestMapping("/engins")
@Tag(name = "Engins", description = "Gestion du parc d'engins et matériel")
class EnginController(
    private val enginService: EnginService
) {
    @PostMapping
    @Operation(summary = "Créer un engin")
    fun create(@Valid @RequestBody request: EnginCreateRequest): ResponseEntity<EnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(enginService.create(request))
    }

    @GetMapping
    @Operation(summary = "Lister les engins")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.findAll(pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un engin par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.findById(id))
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des engins")
    fun search(@RequestParam q: String, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.search(q, pageable))
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Lister les engins disponibles")
    fun findDisponibles(): ResponseEntity<List<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.findDisponibles())
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un engin")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: EnginUpdateRequest): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver un engin")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        enginService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Engin désactivé avec succès"))
    }

    // ========== Affectations ==========
    @PostMapping("/affectations")
    @Operation(summary = "Affecter un engin à un projet")
    fun affecterEngin(@Valid @RequestBody request: AffectationEnginRequest): ResponseEntity<AffectationEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(enginService.affecterEngin(request))
    }

    @GetMapping("/affectations/projet/{projetId}")
    @Operation(summary = "Lister les affectations d'engins d'un projet")
    fun findAffectationsByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsByProjet(projetId, pageable))
    }

    @GetMapping("/{id}/affectations")
    @Operation(summary = "Lister les affectations d'un engin")
    fun findAffectationsByEngin(@PathVariable id: Long): ResponseEntity<List<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsByEngin(id))
    }
}
