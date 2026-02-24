package com.mikaservices.platform.modules.user.controller

import com.mikaservices.platform.modules.user.dto.response.RoleResponse
import com.mikaservices.platform.modules.user.service.RoleService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/roles")
@Tag(name = "Rôles", description = "API de gestion des rôles et permissions")
@SecurityRequirement(name = "bearerAuth")
class RoleController(
    private val roleService: RoleService
) {

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Liste des rôles", description = "Récupération de la liste paginée des rôles")
    fun findAll(
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<RoleResponse>> {
        val roles = roleService.findAll(pageable)
        return ResponseEntity.ok(roles)
    }
    
    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Rôles actifs", description = "Récupération de la liste des rôles actifs (pour formulaire utilisateur)")
    fun findActiveRoles(): ResponseEntity<List<RoleResponse>> {
        val roles = roleService.findActiveRoles()
        return ResponseEntity.ok(roles)
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Rôle par ID", description = "Récupération d'un rôle par son ID")
    fun findById(
        @PathVariable id: Long
    ): ResponseEntity<RoleResponse> {
        val role = roleService.findById(id)
        return ResponseEntity.ok(role)
    }
    
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Rôle par code", description = "Récupération d'un rôle par son code")
    fun findByCode(
        @PathVariable code: String
    ): ResponseEntity<RoleResponse> {
        val role = roleService.findByCode(code)
        return ResponseEntity.ok(role)
    }
    
    @PostMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Ajouter une permission à un rôle", description = "Associe une permission à un rôle")
    fun addPermissionToRole(
        @PathVariable roleId: Long,
        @PathVariable permissionId: Long
    ): ResponseEntity<RoleResponse> {
        val role = roleService.addPermissionToRole(roleId, permissionId)
        return ResponseEntity.ok(role)
    }
    
    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Retirer une permission d'un rôle", description = "Retire une permission d'un rôle")
    fun removePermissionFromRole(
        @PathVariable roleId: Long,
        @PathVariable permissionId: Long
    ): ResponseEntity<RoleResponse> {
        val role = roleService.removePermissionFromRole(roleId, permissionId)
        return ResponseEntity.ok(role)
    }
}
