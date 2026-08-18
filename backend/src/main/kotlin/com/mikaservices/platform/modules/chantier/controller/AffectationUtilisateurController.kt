package com.mikaservices.platform.modules.chantier.controller

import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurRequest
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurResponse
import com.mikaservices.platform.modules.chantier.dto.AffectationUtilisateurUpdateRequest
import com.mikaservices.platform.modules.chantier.service.AffectationUtilisateurService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/affectations-utilisateurs")
@Tag(name = "Affectations utilisateurs", description = "Positionnement individuel des utilisateurs sur les chantiers")
class AffectationUtilisateurController(
    private val affectationService: AffectationUtilisateurService
) {
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Affecter un utilisateur à un chantier")
    fun affecter(@Valid @RequestBody request: AffectationUtilisateurRequest): ResponseEntity<AffectationUtilisateurResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(affectationService.affecter(request))
    }

    @GetMapping("/en-cours")
    @Operation(summary = "Affectations ouvertes (planifiées ou en cours)")
    fun findEnCours(): ResponseEntity<List<AffectationUtilisateurResponse>> {
        return ResponseEntity.ok(affectationService.findEnCours())
    }

    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Affectations d'un chantier")
    fun findByProjet(@PathVariable projetId: Long): ResponseEntity<List<AffectationUtilisateurResponse>> {
        return ResponseEntity.ok(affectationService.findByProjet(projetId))
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Affectations d'un utilisateur")
    fun findByUser(@PathVariable userId: Long): ResponseEntity<List<AffectationUtilisateurResponse>> {
        return ResponseEntity.ok(affectationService.findByUser(userId))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Modifier une affectation (rôle, dates, observations)")
    fun modifier(
        @PathVariable id: Long,
        @Valid @RequestBody request: AffectationUtilisateurUpdateRequest
    ): ResponseEntity<AffectationUtilisateurResponse> {
        return ResponseEntity.ok(affectationService.modifier(id, request))
    }

    @PutMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Terminer une affectation")
    fun terminer(@PathVariable id: Long): ResponseEntity<AffectationUtilisateurResponse> {
        return ResponseEntity.ok(affectationService.terminer(id))
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET')")
    @Operation(summary = "Annuler une affectation")
    fun annuler(@PathVariable id: Long): ResponseEntity<AffectationUtilisateurResponse> {
        return ResponseEntity.ok(affectationService.annuler(id))
    }
}
