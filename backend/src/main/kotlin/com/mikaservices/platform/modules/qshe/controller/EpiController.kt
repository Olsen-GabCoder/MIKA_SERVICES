package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.EpiCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.EpiUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.EpiResponse
import com.mikaservices.platform.modules.qshe.dto.response.EpiSummaryResponse
import com.mikaservices.platform.modules.qshe.service.EpiService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/epi")
class EpiController(private val service: EpiService) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody req: EpiCreateRequest): ResponseEntity<EpiResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(req))

    @GetMapping
    fun listAll(@PageableDefault(size = 50) pageable: Pageable): ResponseEntity<Page<EpiResponse>> =
        ResponseEntity.ok(service.findAll(pageable))

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<EpiResponse> = ResponseEntity.ok(service.findById(id))

    @GetMapping("/user/{userId}")
    fun listByUser(@PathVariable userId: Long): ResponseEntity<List<EpiResponse>> =
        ResponseEntity.ok(service.findByUser(userId))

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(@PathVariable id: Long, @RequestBody req: EpiUpdateRequest): ResponseEntity<EpiResponse> =
        ResponseEntity.ok(service.update(id, req))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }

    @GetMapping("/expires")
    fun listExpires(): ResponseEntity<List<EpiResponse>> = ResponseEntity.ok(service.findExpires())

    @GetMapping("/stock-bas")
    fun listStockBas(): ResponseEntity<List<EpiResponse>> = ResponseEntity.ok(service.findStockBas())

    @GetMapping("/summary")
    fun getSummary(): ResponseEntity<EpiSummaryResponse> = ResponseEntity.ok(service.getSummary())
}
