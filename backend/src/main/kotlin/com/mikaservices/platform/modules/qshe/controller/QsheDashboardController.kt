package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.response.QsheDashboardResponse
import com.mikaservices.platform.modules.qshe.service.QsheDashboardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/dashboard")
class QsheDashboardController(
    private val dashboardService: QsheDashboardService
) {

    @GetMapping("/projet/{projetId}")
    fun getDashboard(@PathVariable projetId: Long): ResponseEntity<QsheDashboardResponse> {
        return ResponseEntity.ok(dashboardService.getDashboard(projetId))
    }
}
