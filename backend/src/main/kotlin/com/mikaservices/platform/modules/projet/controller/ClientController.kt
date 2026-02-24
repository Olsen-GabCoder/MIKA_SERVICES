package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.modules.projet.dto.request.ClientCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.ClientUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.ClientResponse
import com.mikaservices.platform.modules.projet.service.ClientService
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
@RequestMapping("/clients")
@Tag(name = "Clients", description = "Gestion des clients / maîtres d'ouvrage")
class ClientController(
    private val clientService: ClientService
) {

    @PostMapping
    @Operation(summary = "Créer un client")
    fun create(@Valid @RequestBody request: ClientCreateRequest): ResponseEntity<ClientResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.create(request))
    }

    @GetMapping
    @Operation(summary = "Lister les clients")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<ClientResponse>> {
        return ResponseEntity.ok(clientService.findAll(pageable))
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un client par ID")
    fun findById(@PathVariable id: Long): ResponseEntity<ClientResponse> {
        return ResponseEntity.ok(clientService.findById(id))
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Obtenir un client par code")
    fun findByCode(@PathVariable code: String): ResponseEntity<ClientResponse> {
        return ResponseEntity.ok(clientService.findByCode(code))
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des clients par nom")
    fun search(@RequestParam nom: String, @PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<ClientResponse>> {
        return ResponseEntity.ok(clientService.search(nom, pageable))
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un client")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: ClientUpdateRequest): ResponseEntity<ClientResponse> {
        return ResponseEntity.ok(clientService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver un client")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        clientService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Client désactivé avec succès"))
    }
}
