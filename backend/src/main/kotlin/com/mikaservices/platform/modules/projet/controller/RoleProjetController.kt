package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.projet.dto.RoleProjetRequest
import com.mikaservices.platform.modules.projet.dto.RoleProjetResponse
import com.mikaservices.platform.modules.projet.service.RoleProjetService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/roles-projet")
@Tag(name = "Rôles projet", description = "Référentiel des rôles occupés par les utilisateurs sur les projets")
@SecurityRequirement(name = "bearerAuth")
class RoleProjetController(
    private val roleProjetService: RoleProjetService
) {

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Rôles projet actifs", description = "Liste triée par famille (direction → support) puis par nom")
    fun findActive(): ResponseEntity<List<RoleProjetResponse>> =
        ResponseEntity.ok(roleProjetService.findActive())

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Tous les rôles projet (actifs et inactifs)")
    fun findAll(): ResponseEntity<List<RoleProjetResponse>> =
        ResponseEntity.ok(roleProjetService.findAll())

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Créer un rôle projet")
    fun create(@Valid @RequestBody request: RoleProjetRequest): ResponseEntity<RoleProjetResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(roleProjetService.create(request))

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Modifier un rôle projet")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: RoleProjetRequest): ResponseEntity<RoleProjetResponse> =
        ResponseEntity.ok(roleProjetService.update(id, request))

    @PutMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Activer/désactiver un rôle projet")
    fun toggleActif(@PathVariable id: Long): ResponseEntity<RoleProjetResponse> =
        ResponseEntity.ok(roleProjetService.toggleActif(id))
}
