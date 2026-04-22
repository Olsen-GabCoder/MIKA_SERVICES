package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.RisqueCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.RisqueUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.RisqueResponse
import com.mikaservices.platform.modules.qshe.dto.response.RisqueSummaryResponse
import com.mikaservices.platform.modules.qshe.service.RisqueService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/risques")
class RisqueController(private val service: RisqueService) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody req: RisqueCreateRequest): ResponseEntity<RisqueResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(req))

    @GetMapping("/projet/{projetId}")
    fun listByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<RisqueResponse>> =
        ResponseEntity.ok(service.findByProjet(projetId, pageable))

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<RisqueResponse> = ResponseEntity.ok(service.findById(id))

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(@PathVariable id: Long, @Valid @RequestBody req: RisqueUpdateRequest): ResponseEntity<RisqueResponse> =
        ResponseEntity.ok(service.update(id, req))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }

    @GetMapping("/summary/projet/{projetId}")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<RisqueSummaryResponse> =
        ResponseEntity.ok(service.getSummary(projetId))
}
