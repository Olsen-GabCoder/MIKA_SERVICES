package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.ActionCorrectiveCreateRequest
import com.mikaservices.platform.modules.qshe.dto.request.ActionCorrectiveUpdateRequest
import com.mikaservices.platform.modules.qshe.dto.response.ActionCorrectiveResponse
import com.mikaservices.platform.modules.qshe.dto.response.ActionCorrectiveSummaryResponse
import com.mikaservices.platform.modules.qshe.enums.SourceAction
import com.mikaservices.platform.modules.qshe.service.ActionCorrectiveService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/actions")
class ActionCorrectiveController(
    private val actionService: ActionCorrectiveService
) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun create(@Valid @RequestBody request: ActionCorrectiveCreateRequest): ResponseEntity<ActionCorrectiveResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(actionService.create(request))
    }

    @GetMapping("/projet/{projetId}")
    fun listByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ActionCorrectiveResponse>> {
        return ResponseEntity.ok(actionService.findByProjet(projetId, pageable))
    }

    @GetMapping("/source/{sourceType}/{sourceId}")
    fun listBySource(
        @PathVariable sourceType: SourceAction,
        @PathVariable sourceId: Long
    ): ResponseEntity<List<ActionCorrectiveResponse>> {
        return ResponseEntity.ok(actionService.findBySource(sourceType, sourceId))
    }

    @GetMapping("/responsable/{userId}")
    fun listByResponsable(
        @PathVariable userId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ActionCorrectiveResponse>> {
        return ResponseEntity.ok(actionService.findByResponsable(userId, pageable))
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ActionCorrectiveResponse> {
        return ResponseEntity.ok(actionService.findById(id))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: ActionCorrectiveUpdateRequest
    ): ResponseEntity<ActionCorrectiveResponse> {
        return ResponseEntity.ok(actionService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        actionService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/en-retard")
    fun listEnRetard(): ResponseEntity<List<ActionCorrectiveResponse>> {
        return ResponseEntity.ok(actionService.findEnRetard())
    }

    @GetMapping("/summary/projet/{projetId}")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<ActionCorrectiveSummaryResponse> {
        return ResponseEntity.ok(actionService.getSummary(projetId))
    }
}
