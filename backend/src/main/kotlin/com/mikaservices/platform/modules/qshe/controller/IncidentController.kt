package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.enums.StatutIncident
import com.mikaservices.platform.modules.qshe.dto.request.IncidentCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.IncidentUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.IncidentResponse
import com.mikaservices.platform.modules.qshe.dto.response.IncidentSummaryResponse
import com.mikaservices.platform.modules.qshe.service.IncidentService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/incidents")
class IncidentController(
    private val incidentService: IncidentService
) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody request: IncidentCreateRequest): ResponseEntity<IncidentResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.createIncident(request))
    }

    @GetMapping("/projet/{projetId}")
    fun listByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<IncidentResponse>> {
        return ResponseEntity.ok(incidentService.findByProjet(projetId, pageable))
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<IncidentResponse> {
        return ResponseEntity.ok(incidentService.findById(id))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: IncidentUpdateRequest
    ): ResponseEntity<IncidentResponse> {
        return ResponseEntity.ok(incidentService.updateIncident(id, request))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        incidentService.deleteIncident(id)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun changeStatut(
        @PathVariable id: Long,
        @RequestParam statut: StatutIncident
    ): ResponseEntity<IncidentResponse> {
        return ResponseEntity.ok(incidentService.changeStatut(id, statut))
    }

    @GetMapping("/summary/projet/{projetId}")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<IncidentSummaryResponse> {
        return ResponseEntity.ok(incidentService.getSummary(projetId))
    }

    @GetMapping("/declarations-cnss-en-retard")
    fun getDeclarationsCnssEnRetard(): ResponseEntity<List<IncidentResponse>> {
        return ResponseEntity.ok(incidentService.findDeclarationsCnssEnRetard())
    }
}
