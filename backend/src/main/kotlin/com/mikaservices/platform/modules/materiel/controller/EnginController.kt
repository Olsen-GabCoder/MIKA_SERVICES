package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.modules.materiel.dto.request.AffectationEnginRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.EnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.AffectationEnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginResponse
import com.mikaservices.platform.modules.materiel.dto.response.EnginSummaryResponse
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.service.EnginService
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/engins")
@Tag(name = "Engins", description = "Gestion du parc d'engins et matériel")
class EnginController(
    private val enginService: EnginService,
    private val mouvementEnginService: MouvementEnginService,
) {
    @PostMapping
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Créer un engin")
    fun create(@Valid @RequestBody request: EnginCreateRequest): ResponseEntity<EnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(enginService.create(request))
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les engins (filtres optionnels : statut, type)")
    fun findAll(
        @RequestParam(required = false) statut: StatutEngin?,
        @RequestParam(required = false) type: TypeEngin?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ResponseEntity<Page<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.findAll(pageable, statut, type))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Obtenir un engin par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.findById(id))
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Rechercher des engins")
    fun search(@RequestParam q: String, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.search(q, pageable))
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les engins disponibles")
    fun findDisponibles(): ResponseEntity<List<EnginSummaryResponse>> {
        return ResponseEntity.ok(enginService.findDisponibles())
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Mettre à jour un engin")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: EnginUpdateRequest): ResponseEntity<EnginResponse> {
        return ResponseEntity.ok(enginService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Désactiver un engin")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        enginService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Engin désactivé avec succès"))
    }

    // ========== Affectations ==========
    @PostMapping("/affectations")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Affecter un engin à un projet")
    fun affecterEngin(@Valid @RequestBody request: AffectationEnginRequest): ResponseEntity<AffectationEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(enginService.affecterEngin(request))
    }

    @GetMapping("/affectations/projet/{projetId}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les affectations d'engins d'un projet")
    fun findAffectationsByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsByProjet(projetId, pageable))
    }

    @GetMapping("/{id}/affectations")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Lister les affectations d'un engin")
    fun findAffectationsByEngin(@PathVariable id: Long): ResponseEntity<List<AffectationEnginResponse>> {
        return ResponseEntity.ok(enginService.findAffectationsByEngin(id))
    }

    @GetMapping("/{id}/mouvements")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Historique des mouvements d'un engin")
    fun findMouvementsByEngin(@PathVariable id: Long): ResponseEntity<List<MouvementEnginResponse>> {
        return ResponseEntity.ok(mouvementEnginService.findByEnginId(id))
    }
}
