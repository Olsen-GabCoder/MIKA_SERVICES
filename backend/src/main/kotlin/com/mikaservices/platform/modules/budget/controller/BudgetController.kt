package com.mikaservices.platform.modules.budget.controller

import com.mikaservices.platform.modules.budget.dto.request.DepenseCreateRequest
import com.mikaservices.platform.modules.budget.dto.request.DepenseUpdateRequest
import com.mikaservices.platform.modules.budget.dto.response.BudgetSummaryResponse
import com.mikaservices.platform.modules.budget.dto.response.DepenseResponse
import com.mikaservices.platform.modules.budget.service.BudgetService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/budget")
@Tag(name = "Budget", description = "Gestion budgétaire et suivi des dépenses")
class BudgetController(
    private val budgetService: BudgetService
) {
    @PostMapping("/depenses")
    @Operation(summary = "Créer une dépense")
    fun createDepense(@Valid @RequestBody request: DepenseCreateRequest): ResponseEntity<DepenseResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.createDepense(request))
    }

    @GetMapping("/depenses/projet/{projetId}")
    @Operation(summary = "Lister les dépenses d'un projet")
    fun findDepensesByProjet(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<DepenseResponse>> {
        return ResponseEntity.ok(budgetService.findDepensesByProjet(projetId, pageable))
    }

    @GetMapping("/depenses/{id}")
    @Operation(summary = "Obtenir une dépense par ID")
    fun findDepenseById(@PathVariable id: Long): ResponseEntity<DepenseResponse> {
        return ResponseEntity.ok(budgetService.findDepenseById(id))
    }

    @PutMapping("/depenses/{id}")
    @Operation(summary = "Mettre à jour une dépense")
    fun updateDepense(@PathVariable id: Long, @Valid @RequestBody request: DepenseUpdateRequest): ResponseEntity<DepenseResponse> {
        return ResponseEntity.ok(budgetService.updateDepense(id, request))
    }

    @DeleteMapping("/depenses/{id}")
    @Operation(summary = "Supprimer une dépense")
    fun deleteDepense(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        budgetService.deleteDepense(id)
        return ResponseEntity.ok(mapOf("message" to "Dépense supprimée avec succès"))
    }

    @GetMapping("/summary/projet/{projetId}")
    @Operation(summary = "Résumé budgétaire d'un projet")
    fun getBudgetSummary(@PathVariable projetId: Long): ResponseEntity<BudgetSummaryResponse> {
        return ResponseEntity.ok(budgetService.getBudgetSummary(projetId))
    }
}
