package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.modules.materiel.dto.response.JournalAuditTerrainResponse
import com.mikaservices.platform.modules.materiel.service.TerrainAuditService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/** Consultation (web pilotage) du journal d'audit append-only des actions terrain. */
@RestController
@RequestMapping("/audit-terrain")
@Tag(name = "Audit terrain", description = "Journal d'audit des actions de l'app mobile terrain")
class JournalAuditTerrainController(
    private val auditService: TerrainAuditService,
) {
    @GetMapping
    @Operation(summary = "Journal d'audit terrain (filtres action/entité/acteur)")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','CHEF_PROJET','ADMIN','SUPER_ADMIN')")
    fun findAll(
        @RequestParam(required = false) action: String?,
        @RequestParam(required = false) entiteType: String?,
        @RequestParam(required = false) acteurId: Long?,
        @PageableDefault(size = 50, sort = ["createdAt"], direction = Sort.Direction.DESC) pageable: Pageable,
    ): ResponseEntity<Page<JournalAuditTerrainResponse>> =
        ResponseEntity.ok(auditService.findAll(action, entiteType, acteurId, pageable))
}
