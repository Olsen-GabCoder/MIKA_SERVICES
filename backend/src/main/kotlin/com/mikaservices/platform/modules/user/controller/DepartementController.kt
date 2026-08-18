package com.mikaservices.platform.modules.user.controller

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.user.dto.response.DepartementResponse
import com.mikaservices.platform.modules.user.mapper.DepartementMapper
import com.mikaservices.platform.modules.user.repository.DepartementRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/departements")
@Tag(name = "Départements", description = "API des départements")
@SecurityRequirement(name = "bearerAuth")
class DepartementController(
    private val departementRepository: DepartementRepository,
    private val userRepository: UserRepository
) {

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Départements actifs", description = "Liste des départements actifs (pour formulaire utilisateur)")
    fun findActive(): ResponseEntity<List<DepartementResponse>> {
        val departements = departementRepository.findByActifTrue().sortedBy { it.nom.lowercase() }
        return ResponseEntity.ok(DepartementMapper.toResponseList(departements))
    }

    @PutMapping("/{id}/responsable/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Transactional
    @Operation(summary = "Désigner un responsable", description = "Affecte un utilisateur comme responsable du département")
    fun setResponsable(@PathVariable id: Long, @PathVariable userId: Long): ResponseEntity<DepartementResponse> {
        val departement = departementRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Département introuvable : $id") }
        val user = userRepository.findById(userId)
            .orElseThrow { ResourceNotFoundException("Utilisateur introuvable : $userId") }
        departement.responsable = user
        return ResponseEntity.ok(DepartementMapper.toResponse(departementRepository.save(departement)))
    }
}
