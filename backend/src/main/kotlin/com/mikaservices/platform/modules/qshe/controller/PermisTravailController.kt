package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.PermisTravailCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.PermisTravailUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.PermisTravailResponse
import com.mikaservices.platform.modules.qshe.dto.response.PermisTravailSummaryResponse
import com.mikaservices.platform.modules.qshe.service.PermisTravailService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/permis")
class PermisTravailController(private val service: PermisTravailService) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody req: PermisTravailCreateRequest): ResponseEntity<PermisTravailResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(req))

    @GetMapping("/projet/{projetId}")
    fun listByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<PermisTravailResponse>> =
        ResponseEntity.ok(service.findByProjet(projetId, pageable))

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<PermisTravailResponse> = ResponseEntity.ok(service.findById(id))

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(@PathVariable id: Long, @RequestBody req: PermisTravailUpdateRequest): ResponseEntity<PermisTravailResponse> =
        ResponseEntity.ok(service.update(id, req))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }

    @GetMapping("/summary/projet/{projetId}")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<PermisTravailSummaryResponse> =
        ResponseEntity.ok(service.getSummary(projetId))
}
