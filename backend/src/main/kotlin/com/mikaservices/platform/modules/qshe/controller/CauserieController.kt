package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.CauserieCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.CauserieUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.CauserieResponse
import com.mikaservices.platform.modules.qshe.dto.response.CauserieSummaryResponse
import com.mikaservices.platform.modules.qshe.service.CauserieService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/causeries")
class CauserieController(private val service: CauserieService) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody req: CauserieCreateRequest): ResponseEntity<CauserieResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(req))

    @GetMapping("/projet/{projetId}")
    fun listByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<CauserieResponse>> =
        ResponseEntity.ok(service.findByProjet(projetId, pageable))

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<CauserieResponse> = ResponseEntity.ok(service.findById(id))

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(@PathVariable id: Long, @RequestBody req: CauserieUpdateRequest): ResponseEntity<CauserieResponse> =
        ResponseEntity.ok(service.update(id, req))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }

    @GetMapping("/summary/projet/{projetId}")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<CauserieSummaryResponse> =
        ResponseEntity.ok(service.getSummary(projetId))
}
