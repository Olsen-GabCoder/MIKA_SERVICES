package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginActionRequest
import com.mikaservices.platform.modules.materiel.dto.request.MouvementEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.MouvementEnginResponse
import com.mikaservices.platform.modules.materiel.service.MouvementEnginService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/mouvements")
@Tag(name = "Mouvements engins", description = "Ordres de déplacement inter-chantiers")
class MouvementEnginController(
    private val mouvementEnginService: MouvementEnginService,
) {

    @PostMapping
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Créer un ordre de mouvement")
    fun create(@Valid @RequestBody request: MouvementEnginCreateRequest): ResponseEntity<MouvementEnginResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(mouvementEnginService.create(request))
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Liste des mouvements (filtres optionnels)")
    fun list(
        @RequestParam(required = false) statut: StatutMouvementEngin?,
        @RequestParam(required = false) enginId: Long?,
        @RequestParam(required = false) projetId: Long?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) dateFrom: LocalDateTime?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) dateTo: LocalDateTime?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ResponseEntity<Page<MouvementEnginResponse>> {
        return ResponseEntity.ok(
            mouvementEnginService.findAllFiltered(statut, enginId, projetId, dateFrom, dateTo, pageable)
        )
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','CHEF_CHANTIER','SUPER_ADMIN','ADMIN')")
    @Operation(summary = "Détail d'un mouvement")
    fun getById(@PathVariable id: Long): ResponseEntity<MouvementEnginResponse> {
        return ResponseEntity.ok(mouvementEnginService.findById(id))
    }

    @PatchMapping("/{id}/confirmer-depart")
    @PreAuthorize("hasAnyRole('CHEF_PROJET','CHEF_CHANTIER','LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Confirmer le départ (chantier source ou logistique)")
    fun confirmerDepart(
        @PathVariable id: Long,
        @RequestBody(required = false) body: MouvementEnginActionRequest?,
    ): ResponseEntity<MouvementEnginResponse> {
        return ResponseEntity.ok(mouvementEnginService.confirmerDepart(id, body))
    }

    @PatchMapping("/{id}/confirmer-reception")
    @PreAuthorize("hasAnyRole('CHEF_PROJET','CHEF_CHANTIER','LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Confirmer la réception (chantier destination ou logistique)")
    fun confirmerReception(
        @PathVariable id: Long,
        @RequestBody(required = false) body: MouvementEnginActionRequest?,
    ): ResponseEntity<MouvementEnginResponse> {
        return ResponseEntity.ok(mouvementEnginService.confirmerReception(id, body))
    }

    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Annuler un mouvement (avant départ confirmé)")
    fun annuler(
        @PathVariable id: Long,
        @RequestBody(required = false) body: MouvementEnginActionRequest?,
    ): ResponseEntity<MouvementEnginResponse> {
        return ResponseEntity.ok(mouvementEnginService.annuler(id, body))
    }
}
