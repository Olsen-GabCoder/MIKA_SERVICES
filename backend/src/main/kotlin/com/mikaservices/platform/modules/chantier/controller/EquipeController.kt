package com.mikaservices.platform.modules.chantier.controller

import com.mikaservices.platform.modules.chantier.dto.request.*
import com.mikaservices.platform.modules.chantier.dto.response.*
import com.mikaservices.platform.modules.chantier.service.EquipeService
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
@RequestMapping("/equipes")
@Tag(name = "Équipes", description = "Gestion des équipes et affectations")
class EquipeController(
    private val equipeService: EquipeService
) {
    @PostMapping
    @Operation(summary = "Créer une équipe")
    fun create(@Valid @RequestBody request: EquipeCreateRequest): ResponseEntity<EquipeResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipeService.createEquipe(request))
    }

    @GetMapping
    @Operation(summary = "Lister les équipes")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<EquipeResponse>> {
        return ResponseEntity.ok(equipeService.findAllEquipes(pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir une équipe par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<EquipeResponse> {
        return ResponseEntity.ok(equipeService.findEquipeById(id))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une équipe")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: EquipeUpdateRequest): ResponseEntity<EquipeResponse> {
        return ResponseEntity.ok(equipeService.updateEquipe(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver une équipe")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        equipeService.deleteEquipe(id)
        return ResponseEntity.ok(mapOf("message" to "Équipe désactivée avec succès"))
    }

    // ========== Membres ==========
    @PostMapping("/{id}/membres")
    @Operation(summary = "Ajouter un membre à une équipe")
    fun ajouterMembre(@PathVariable id: Long, @Valid @RequestBody request: MembreEquipeRequest): ResponseEntity<MembreEquipeResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipeService.ajouterMembre(request.copy(equipeId = id)))
    }

    @GetMapping("/{id}/membres")
    @Operation(summary = "Lister les membres d'une équipe")
    fun findMembres(@PathVariable id: Long): ResponseEntity<List<MembreEquipeResponse>> {
        return ResponseEntity.ok(equipeService.findMembres(id))
    }

    // ========== Affectations ==========
    @PostMapping("/affectations")
    @Operation(summary = "Affecter une équipe à un projet")
    fun affecterEquipe(@Valid @RequestBody request: AffectationChantierRequest): ResponseEntity<AffectationChantierResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipeService.affecterEquipe(request))
    }

    @GetMapping("/affectations/projet/{projetId}")
    @Operation(summary = "Lister les affectations d'un projet")
    fun findAffectations(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<AffectationChantierResponse>> {
        return ResponseEntity.ok(equipeService.findAffectations(projetId, pageable))
    }

    @GetMapping("/affectations/user/{userId}")
    @Operation(summary = "Lister les affectations d'un utilisateur")
    fun findAffectationsByUser(@PathVariable userId: Long): ResponseEntity<List<AffectationChantierResponse>> {
        return ResponseEntity.ok(equipeService.findAffectationsByUserId(userId))
    }
}
