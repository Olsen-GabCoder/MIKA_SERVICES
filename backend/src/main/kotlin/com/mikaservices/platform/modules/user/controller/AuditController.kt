package com.mikaservices.platform.modules.user.controller

import com.mikaservices.platform.modules.user.dto.response.AuditLogResponse
import com.mikaservices.platform.modules.user.dto.response.GlobalAuditStats
import com.mikaservices.platform.modules.user.dto.response.UserActivitySummary
import com.mikaservices.platform.modules.user.service.AuditLogService
import com.mikaservices.platform.modules.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

@RestController
@RequestMapping("/audit")
@Tag(name = "Audit", description = "Suivi d'activité des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
class AuditController(
    private val auditLogService: AuditLogService,
    private val userService: UserService
) {

    @PostMapping("/page-view")
    @Operation(summary = "Enregistrer une visite de page")
    fun trackPageView(
        @RequestBody request: PageViewRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Unit> {
        val user = userService.getCurrentUser()
        val ip = httpRequest.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim()
            ?: httpRequest.remoteAddr
        auditLogService.logPageView(user.id, request.page, ip)
        return ResponseEntity.ok().build()
    }

    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Logs d'audit globaux", description = "Tous les logs avec filtres (userId, module, action, dates). Dates en ISO datetime (ex. 2026-03-17T00:00:00.000Z). Parsing défensif : valeur invalide ignorée.")
    fun getGlobalLogs(
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) module: String?,
        @RequestParam(required = false) action: String?,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?,
        @PageableDefault(size = 40) pageable: Pageable
    ): ResponseEntity<Page<AuditLogResponse>> {
        val actions = action?.split(",")?.map { it.trim() }?.filter { it.isNotBlank() }
        val start = parseIsoToLocalDateTime(startDate)
        val end = parseIsoToLocalDateTime(endDate)
        return ResponseEntity.ok(auditLogService.findFiltered(userId, module, actions, start, end, pageable))
    }

    /** Parse ISO instant (ex. 2026-03-17T00:00:00.000Z) en LocalDateTime UTC. Retourne null si invalide (évite 500). */
    private fun parseIsoToLocalDateTime(iso: String?): LocalDateTime? {
        if (iso.isNullOrBlank()) return null
        return try {
            Instant.parse(iso).atZone(ZoneId.of("UTC")).toLocalDateTime()
        } catch (_: Exception) {
            null
        }
    }

    @GetMapping("/user/{userId}/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Résumé d'activité utilisateur")
    fun getUserActivitySummary(@PathVariable userId: Long): ResponseEntity<UserActivitySummary> {
        return ResponseEntity.ok(auditLogService.getUserActivitySummary(userId))
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Statistiques globales", description = "Métriques clés : événements du jour, top pages, top utilisateurs, utilisateurs en ligne")
    fun getGlobalStats(): ResponseEntity<GlobalAuditStats> {
        return ResponseEntity.ok(auditLogService.getGlobalStats())
    }

    @GetMapping("/filters")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Options de filtres", description = "Modules et actions distincts pour les dropdowns")
    fun getFilterOptions(): ResponseEntity<Map<String, List<String>>> {
        return ResponseEntity.ok(auditLogService.getFilterOptions())
    }
}

data class PageViewRequest(val page: String)
