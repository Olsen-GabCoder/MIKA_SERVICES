package com.mikaservices.platform.modules.fournisseur.controller

import com.mikaservices.platform.modules.fournisseur.dto.request.*
import com.mikaservices.platform.modules.fournisseur.dto.response.*
import com.mikaservices.platform.modules.fournisseur.service.FournisseurService
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
@RequestMapping("/fournisseurs")
@Tag(name = "Fournisseurs", description = "Gestion des fournisseurs et commandes")
class FournisseurController(private val service: FournisseurService) {

    @PostMapping
    @Operation(summary = "Créer un fournisseur")
    fun create(@Valid @RequestBody request: FournisseurCreateRequest): ResponseEntity<FournisseurResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createFournisseur(request))

    @GetMapping
    @Operation(summary = "Lister les fournisseurs")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<FournisseurResponse>> =
        ResponseEntity.ok(service.findAllFournisseurs(pageable))

    @GetMapping("/search")
    @Operation(summary = "Rechercher des fournisseurs")
    fun search(@RequestParam q: String, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<FournisseurResponse>> =
        ResponseEntity.ok(service.searchFournisseurs(q, pageable))

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un fournisseur")
    fun findById(@PathVariable id: Long): ResponseEntity<FournisseurResponse> =
        ResponseEntity.ok(service.findFournisseurById(id))

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un fournisseur")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: FournisseurUpdateRequest): ResponseEntity<FournisseurResponse> =
        ResponseEntity.ok(service.updateFournisseur(id, request))

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un fournisseur")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        service.deleteFournisseur(id); return ResponseEntity.ok(mapOf("message" to "Fournisseur supprimé"))
    }

    // Commandes
    @PostMapping("/commandes")
    @Operation(summary = "Créer une commande")
    fun createCommande(@Valid @RequestBody request: CommandeCreateRequest): ResponseEntity<CommandeResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createCommande(request))

    @GetMapping("/commandes")
    @Operation(summary = "Lister les commandes")
    fun findAllCommandes(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<CommandeResponse>> =
        ResponseEntity.ok(service.findAllCommandes(pageable))

    @GetMapping("/{fournisseurId}/commandes")
    @Operation(summary = "Commandes d'un fournisseur")
    fun findCommandesByFournisseur(@PathVariable fournisseurId: Long, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<CommandeResponse>> =
        ResponseEntity.ok(service.findCommandesByFournisseur(fournisseurId, pageable))

    @PutMapping("/commandes/{id}")
    @Operation(summary = "Mettre à jour une commande")
    fun updateCommande(@PathVariable id: Long, @Valid @RequestBody request: CommandeUpdateRequest): ResponseEntity<CommandeResponse> =
        ResponseEntity.ok(service.updateCommande(id, request))

    @DeleteMapping("/commandes/{id}")
    @Operation(summary = "Supprimer une commande")
    fun deleteCommande(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        service.deleteCommande(id); return ResponseEntity.ok(mapOf("message" to "Commande supprimée"))
    }
}
