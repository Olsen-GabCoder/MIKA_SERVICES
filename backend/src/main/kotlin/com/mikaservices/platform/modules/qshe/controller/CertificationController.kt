package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.CertificationCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.CertificationUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.CertificationResponse
import com.mikaservices.platform.modules.qshe.dto.response.CertificationSummaryResponse
import com.mikaservices.platform.modules.qshe.service.CertificationService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/certifications")
class CertificationController(private val service: CertificationService) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody req: CertificationCreateRequest): ResponseEntity<CertificationResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(req))

    @GetMapping("/user/{userId}")
    fun listByUser(@PathVariable userId: Long, @PageableDefault(size = 50) pageable: Pageable): ResponseEntity<Page<CertificationResponse>> =
        ResponseEntity.ok(service.findByUser(userId, pageable))

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<CertificationResponse> = ResponseEntity.ok(service.findById(id))

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(@PathVariable id: Long, @RequestBody req: CertificationUpdateRequest): ResponseEntity<CertificationResponse> =
        ResponseEntity.ok(service.update(id, req))

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }

    @GetMapping("/expirant")
    fun listExpirant(@RequestParam(defaultValue = "60") jours: Int): ResponseEntity<List<CertificationResponse>> =
        ResponseEntity.ok(service.findExpirantDans(jours))

    @GetMapping("/expirees")
    fun listExpirees(): ResponseEntity<List<CertificationResponse>> = ResponseEntity.ok(service.findExpirees())

    @GetMapping("/summary")
    fun getSummary(): ResponseEntity<CertificationSummaryResponse> = ResponseEntity.ok(service.getSummary())
}
