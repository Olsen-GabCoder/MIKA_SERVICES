package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.ChecklistTemplateCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.InspectionCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.InspectionUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.ChecklistTemplateResponse
import com.mikaservices.platform.modules.qshe.dto.response.InspectionResponse
import com.mikaservices.platform.modules.qshe.service.InspectionService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/inspections")
class InspectionController(
    private val inspectionService: InspectionService
) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody request: InspectionCreateRequest): ResponseEntity<InspectionResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.createInspection(request))
    }

    @GetMapping("/projet/{projetId}")
    fun listByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<InspectionResponse>> {
        return ResponseEntity.ok(inspectionService.findByProjet(projetId, pageable))
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<InspectionResponse> {
        return ResponseEntity.ok(inspectionService.findById(id))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(@PathVariable id: Long, @RequestBody request: InspectionUpdateRequest): ResponseEntity<InspectionResponse> {
        return ResponseEntity.ok(inspectionService.updateInspection(id, request))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        inspectionService.deleteInspection(id)
        return ResponseEntity.noContent().build()
    }

    // --- Templates ---

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun createTemplate(@Valid @RequestBody request: ChecklistTemplateCreateRequest): ResponseEntity<ChecklistTemplateResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.createTemplate(request))
    }

    @GetMapping("/templates")
    fun listTemplates(): ResponseEntity<List<ChecklistTemplateResponse>> {
        return ResponseEntity.ok(inspectionService.findAllTemplates())
    }

    @GetMapping("/templates/{id}")
    fun getTemplate(@PathVariable id: Long): ResponseEntity<ChecklistTemplateResponse> {
        return ResponseEntity.ok(inspectionService.findTemplateById(id))
    }
}
