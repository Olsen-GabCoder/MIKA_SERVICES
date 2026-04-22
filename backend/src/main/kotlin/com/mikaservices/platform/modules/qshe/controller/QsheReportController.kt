package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.response.QsheReportResponse
import com.mikaservices.platform.modules.qshe.service.QsheReportService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/report")
class QsheReportController(private val reportService: QsheReportService) {

    @GetMapping("/projet/{projetId}")
    fun getReport(@PathVariable projetId: Long): ResponseEntity<QsheReportResponse> =
        ResponseEntity.ok(reportService.generateReport(projetId))
}
