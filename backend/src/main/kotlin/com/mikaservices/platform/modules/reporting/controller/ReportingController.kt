package com.mikaservices.platform.modules.reporting.controller

import com.mikaservices.platform.modules.reporting.dto.response.GlobalDashboardResponse
import com.mikaservices.platform.modules.reporting.dto.response.ProjetReportResponse
import com.mikaservices.platform.modules.reporting.service.ReportingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/reporting")
@Tag(name = "Reporting & Analyse", description = "Tableaux de bord et rapports globaux")
class ReportingController(
    private val reportingService: ReportingService
) {
    @GetMapping("/dashboard")
    @Operation(summary = "Tableau de bord global")
    fun getGlobalDashboard(): ResponseEntity<GlobalDashboardResponse> {
        return ResponseEntity.ok(reportingService.getGlobalDashboard())
    }

    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Rapport détaillé d'un projet")
    fun getProjetReport(@PathVariable projetId: Long): ResponseEntity<ProjetReportResponse> {
        return ResponseEntity.ok(reportingService.getProjetReport(projetId))
    }
}
