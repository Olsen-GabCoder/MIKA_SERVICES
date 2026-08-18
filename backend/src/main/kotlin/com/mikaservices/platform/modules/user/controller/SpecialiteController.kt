package com.mikaservices.platform.modules.user.controller

import com.mikaservices.platform.modules.user.dto.response.SpecialiteResponse
import com.mikaservices.platform.modules.user.mapper.SpecialiteMapper
import com.mikaservices.platform.modules.user.repository.SpecialiteRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/specialites")
@Tag(name = "Spécialités", description = "API des spécialités métier")
@SecurityRequirement(name = "bearerAuth")
class SpecialiteController(
    private val specialiteRepository: SpecialiteRepository
) {

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Spécialités actives", description = "Liste des spécialités actives (pour formulaire utilisateur)")
    fun findActive(): ResponseEntity<List<SpecialiteResponse>> {
        val specialites = specialiteRepository.findByActifTrue().sortedBy { it.nom.lowercase() }
        return ResponseEntity.ok(SpecialiteMapper.toResponseList(specialites))
    }
}
