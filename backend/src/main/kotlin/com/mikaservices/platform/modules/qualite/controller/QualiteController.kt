package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.ControleQualiteCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.ControleQualiteUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.request.NonConformiteCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.NonConformiteUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.ControleQualiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.NonConformiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.QualiteSummaryResponse
import com.mikaservices.platform.modules.qualite.service.QualiteService
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
@RequestMapping("/qualite")
@Tag(name = "Qualité & Conformité", description = "Gestion des contrôles qualité et non-conformités")
class QualiteController(
    private val qualiteService: QualiteService
) {
    // ==================== CONTRÔLES QUALITÉ ====================

    @PostMapping("/controles")
    @Operation(summary = "Créer un contrôle qualité")
    fun createControle(@Valid @RequestBody request: ControleQualiteCreateRequest): ResponseEntity<ControleQualiteResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(qualiteService.createControle(request))
    }

    @GetMapping("/controles/projet/{projetId}")
    @Operation(summary = "Lister les contrôles qualité d'un projet")
    fun findControlesByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ControleQualiteResponse>> {
        return ResponseEntity.ok(qualiteService.findControlesByProjet(projetId, pageable))
    }

    @GetMapping("/controles/{id}")
    @Operation(summary = "Obtenir un contrôle qualité par ID")
    fun findControleById(@PathVariable id: Long): ResponseEntity<ControleQualiteResponse> {
        return ResponseEntity.ok(qualiteService.findControleById(id))
    }

    @PutMapping("/controles/{id}")
    @Operation(summary = "Mettre à jour un contrôle qualité")
    fun updateControle(
        @PathVariable id: Long,
        @Valid @RequestBody request: ControleQualiteUpdateRequest
    ): ResponseEntity<ControleQualiteResponse> {
        return ResponseEntity.ok(qualiteService.updateControle(id, request))
    }

    @DeleteMapping("/controles/{id}")
    @Operation(summary = "Supprimer un contrôle qualité")
    fun deleteControle(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        qualiteService.deleteControle(id)
        return ResponseEntity.ok(mapOf("message" to "Contrôle qualité supprimé avec succès"))
    }

    // ==================== NON-CONFORMITÉS ====================

    @PostMapping("/non-conformites")
    @Operation(summary = "Créer une non-conformité")
    fun createNonConformite(@Valid @RequestBody request: NonConformiteCreateRequest): ResponseEntity<NonConformiteResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(qualiteService.createNonConformite(request))
    }

    @GetMapping("/non-conformites/controle/{controleId}")
    @Operation(summary = "Lister les non-conformités d'un contrôle")
    fun findNcByControle(
        @PathVariable controleId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<NonConformiteResponse>> {
        return ResponseEntity.ok(qualiteService.findNcByControle(controleId, pageable))
    }

    @GetMapping("/non-conformites/{id}")
    @Operation(summary = "Obtenir une non-conformité par ID")
    fun findNcById(@PathVariable id: Long): ResponseEntity<NonConformiteResponse> {
        return ResponseEntity.ok(qualiteService.findNcById(id))
    }

    @GetMapping("/non-conformites/en-retard")
    @Operation(summary = "Lister les non-conformités en retard")
    fun findNcEnRetard(): ResponseEntity<List<NonConformiteResponse>> {
        return ResponseEntity.ok(qualiteService.findNcEnRetard())
    }

    @PutMapping("/non-conformites/{id}")
    @Operation(summary = "Mettre à jour une non-conformité")
    fun updateNonConformite(
        @PathVariable id: Long,
        @Valid @RequestBody request: NonConformiteUpdateRequest
    ): ResponseEntity<NonConformiteResponse> {
        return ResponseEntity.ok(qualiteService.updateNonConformite(id, request))
    }

    @DeleteMapping("/non-conformites/{id}")
    @Operation(summary = "Supprimer une non-conformité")
    fun deleteNonConformite(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        qualiteService.deleteNonConformite(id)
        return ResponseEntity.ok(mapOf("message" to "Non-conformité supprimée avec succès"))
    }

    // ==================== TABLEAU DE BORD ====================

    @GetMapping("/summary/projet/{projetId}")
    @Operation(summary = "Tableau de bord qualité d'un projet")
    fun getQualiteSummary(@PathVariable projetId: Long): ResponseEntity<QualiteSummaryResponse> {
        return ResponseEntity.ok(qualiteService.getQualiteSummary(projetId))
    }
}
