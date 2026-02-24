package com.mikaservices.platform.modules.reunionhebdo.controller

import com.mikaservices.platform.common.enums.StatutReunion
import com.mikaservices.platform.modules.reunionhebdo.dto.request.PointProjetPVRequest
import com.mikaservices.platform.modules.reunionhebdo.dto.request.ReunionHebdoCreateRequest
import com.mikaservices.platform.modules.reunionhebdo.dto.request.ReunionHebdoUpdateRequest
import com.mikaservices.platform.modules.reunionhebdo.dto.response.PointProjetPVResponse
import com.mikaservices.platform.modules.reunionhebdo.dto.response.ReunionHebdoResponse
import com.mikaservices.platform.modules.reunionhebdo.dto.response.ReunionHebdoSummaryResponse
import com.mikaservices.platform.modules.reunionhebdo.service.ReunionHebdoService
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
@RequestMapping("/reunions-hebdo")
@Tag(name = "Réunions hebdomadaires", description = "Gestion des réunions hebdomadaires et procès-verbaux")
class ReunionHebdoController(
    private val reunionHebdoService: ReunionHebdoService
) {

    @PostMapping
    @Operation(summary = "Créer une réunion hebdomadaire")
    fun create(@Valid @RequestBody request: ReunionHebdoCreateRequest): ResponseEntity<ReunionHebdoResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(reunionHebdoService.create(request))
    }

    @GetMapping
    @Operation(summary = "Lister les réunions hebdomadaires")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<ReunionHebdoSummaryResponse>> {
        return ResponseEntity.ok(reunionHebdoService.findAll(pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir une réunion (PV complet)")
    fun findById(@PathVariable id: Long): ResponseEntity<ReunionHebdoResponse> {
        return ResponseEntity.ok(reunionHebdoService.findById(id))
    }

    @GetMapping("/statut/{statut}")
    @Operation(summary = "Lister les réunions par statut")
    fun findByStatut(@PathVariable statut: StatutReunion): ResponseEntity<List<ReunionHebdoSummaryResponse>> {
        return ResponseEntity.ok(reunionHebdoService.findByStatut(statut))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une réunion")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: ReunionHebdoUpdateRequest
    ): ResponseEntity<ReunionHebdoResponse> {
        return ResponseEntity.ok(reunionHebdoService.update(id, request))
    }

    @PostMapping("/{reunionId}/points-projet")
    @Operation(summary = "Ajouter ou mettre à jour un point projet dans le PV")
    fun savePointProjet(
        @PathVariable reunionId: Long,
        @Valid @RequestBody request: PointProjetPVRequest
    ): ResponseEntity<PointProjetPVResponse> {
        return ResponseEntity.ok(reunionHebdoService.savePointProjet(reunionId, request))
    }

    @PutMapping("/{reunionId}/points-projet")
    @Operation(summary = "Mettre à jour tous les points projet du PV")
    fun savePointsProjet(
        @PathVariable reunionId: Long,
        @Valid @RequestBody points: List<PointProjetPVRequest>
    ): ResponseEntity<ReunionHebdoResponse> {
        return ResponseEntity.ok(reunionHebdoService.savePointsProjet(reunionId, points))
    }

    @DeleteMapping("/{reunionId}/points-projet/{pointId}")
    @Operation(summary = "Supprimer un point projet du PV")
    fun deletePointProjet(
        @PathVariable reunionId: Long,
        @PathVariable pointId: Long
    ): ResponseEntity<Map<String, String>> {
        reunionHebdoService.deletePointProjet(reunionId, pointId)
        return ResponseEntity.ok(mapOf("message" to "Point projet supprimé du PV"))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une réunion")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        reunionHebdoService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Réunion supprimée"))
    }
}
