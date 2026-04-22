package com.mikaservices.platform.modules.qshe.controller

import com.mikaservices.platform.modules.qshe.dto.request.*
import com.mikaservices.platform.modules.qshe.dto.response.*
import com.mikaservices.platform.modules.qshe.service.EnvironnementService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qshe/environnement")
class EnvironnementController(private val service: EnvironnementService) {

    // --- Suivi mesures ---
    @PostMapping("/mesures")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun createMesure(@Valid @RequestBody req: SuiviEnvCreateRequest): ResponseEntity<SuiviEnvResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createSuivi(req))

    @GetMapping("/mesures/projet/{projetId}")
    fun listMesures(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<SuiviEnvResponse>> =
        ResponseEntity.ok(service.findSuiviByProjet(projetId, pageable))

    @DeleteMapping("/mesures/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun deleteMesure(@PathVariable id: Long): ResponseEntity<Void> { service.deleteSuivi(id); return ResponseEntity.noContent().build() }

    // --- Dechets ---
    @PostMapping("/dechets")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun createDechet(@Valid @RequestBody req: DechetCreateRequest): ResponseEntity<DechetResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createDechet(req))

    @GetMapping("/dechets/projet/{projetId}")
    fun listDechets(@PathVariable projetId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<DechetResponse>> =
        ResponseEntity.ok(service.findDechetsByProjet(projetId, pageable))

    @DeleteMapping("/dechets/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun deleteDechet(@PathVariable id: Long): ResponseEntity<Void> { service.deleteDechet(id); return ResponseEntity.noContent().build() }

    // --- Produits chimiques ---
    @PostMapping("/produits")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun createProduit(@Valid @RequestBody req: ProduitChimiqueCreateRequest): ResponseEntity<ProduitChimiqueResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createProduit(req))

    @GetMapping("/produits")
    fun listProduits(@PageableDefault(size = 50) pageable: Pageable): ResponseEntity<Page<ProduitChimiqueResponse>> =
        ResponseEntity.ok(service.findProduits(pageable))

    @GetMapping("/produits/{id}")
    fun getProduit(@PathVariable id: Long): ResponseEntity<ProduitChimiqueResponse> = ResponseEntity.ok(service.findProduitById(id))

    @PutMapping("/produits/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER')")
    fun updateProduit(@PathVariable id: Long, @RequestBody req: ProduitChimiqueUpdateRequest): ResponseEntity<ProduitChimiqueResponse> =
        ResponseEntity.ok(service.updateProduit(id, req))

    @DeleteMapping("/produits/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    fun deleteProduit(@PathVariable id: Long): ResponseEntity<Void> { service.deleteProduit(id); return ResponseEntity.noContent().build() }

    // --- Summary ---
    @GetMapping("/summary/projet/{projetId}")
    fun getSummary(@PathVariable projetId: Long): ResponseEntity<EnvironnementSummaryResponse> =
        ResponseEntity.ok(service.getSummary(projetId))
}
