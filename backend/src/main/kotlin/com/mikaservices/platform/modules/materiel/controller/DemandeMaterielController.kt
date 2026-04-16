package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommentaireRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielLignePayload
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielCommanderRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielRejetRequest
import com.mikaservices.platform.modules.materiel.dto.request.DemandeMaterielValidationRequest
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielHistoriqueResponse
import com.mikaservices.platform.modules.materiel.dto.response.DemandeMaterielResponse
import com.mikaservices.platform.modules.materiel.service.DemandeMaterielService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/dma")
@Tag(name = "DMA", description = "Demandes de matériel")
class DemandeMaterielController(
    private val demandeMaterielService: DemandeMaterielService,
) {

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Liste des DMA (filtrée selon le rôle)")
    fun list(
        @RequestParam(required = false) statut: StatutDemandeMateriel?,
        @RequestParam(required = false) projetId: Long?,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ResponseEntity<Page<DemandeMaterielResponse>> {
        return ResponseEntity.ok(demandeMaterielService.findAll(statut, projetId, pageable))
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Détail d'une DMA")
    fun getById(@PathVariable id: Long): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.findById(id))
    }

    @GetMapping("/{id}/historique")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historique des statuts")
    fun historique(@PathVariable id: Long): ResponseEntity<List<DemandeMaterielHistoriqueResponse>> {
        return ResponseEntity.ok(demandeMaterielService.findHistorique(id))
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','CHEF_CHANTIER','SUPER_ADMIN','ADMIN','LOGISTIQUE')")
    @Operation(summary = "Créer une DMA")
    fun create(@Valid @RequestBody request: DemandeMaterielCreateRequest): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body(demandeMaterielService.create(request))
    }

    @PostMapping("/{id}/lignes")
    @PreAuthorize("hasAnyRole('USER','CHEF_CHANTIER','SUPER_ADMIN','LOGISTIQUE')")
    @Operation(summary = "Ajouter une ligne")
    fun addLigne(
        @PathVariable id: Long,
        @Valid @RequestBody payload: DemandeMaterielLignePayload,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.addLigne(id, payload))
    }

    @PatchMapping("/{id}/valider-chantier")
    @PreAuthorize("hasAnyRole('CHEF_CHANTIER','LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Validation ou rejet chef de chantier")
    fun validerChantier(
        @PathVariable id: Long,
        @Valid @RequestBody request: DemandeMaterielValidationRequest,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.validerChantier(id, request))
    }

    @PatchMapping("/{id}/valider-projet")
    @PreAuthorize("hasAnyRole('CHEF_PROJET','LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Validation ou rejet chef de projet")
    fun validerProjet(
        @PathVariable id: Long,
        @Valid @RequestBody request: DemandeMaterielValidationRequest,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.validerProjet(id, request))
    }

    @PatchMapping("/{id}/prendre-en-charge")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN','ADMIN')")
    @Operation(summary = "Prise en charge par la logistique")
    fun prendreEnCharge(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.prendreEnCharge(id, body))
    }

    @PatchMapping("/{id}/demander-complement")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN','ADMIN')")
    @Operation(summary = "Demander un complément au terrain")
    fun demanderComplement(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.demanderComplement(id, body))
    }

    @PatchMapping("/{id}/completer")
    @PreAuthorize("hasAnyRole('USER','CHEF_CHANTIER','LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Après complément : renvoi en traitement logistique")
    fun completer(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.completer(id, body))
    }

    @PatchMapping("/{id}/commander")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN','ADMIN')")
    @Operation(summary = "Lier une commande et passer en EN_COMMANDE")
    fun commander(
        @PathVariable id: Long,
        @Valid @RequestBody request: DemandeMaterielCommanderRequest,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.commander(id, request))
    }

    @PatchMapping("/{id}/livrer")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','USER','SUPER_ADMIN')")
    @Operation(summary = "Enregistrer la livraison")
    fun livrer(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.livrer(id, body))
    }

    @PatchMapping("/{id}/cloturer")
    @PreAuthorize("hasAnyRole('LOGISTIQUE','SUPER_ADMIN','ADMIN')")
    @Operation(summary = "Clôturer la DMA")
    fun cloturer(
        @PathVariable id: Long,
        @RequestBody(required = false) body: DemandeMaterielCommentaireRequest?,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.cloturer(id, body))
    }

    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('CHEF_CHANTIER','CHEF_PROJET','LOGISTIQUE','SUPER_ADMIN')")
    @Operation(summary = "Rejet selon l'étape (service vérifie le statut et le rôle)")
    fun rejeter(
        @PathVariable id: Long,
        @Valid @RequestBody request: DemandeMaterielRejetRequest,
    ): ResponseEntity<DemandeMaterielResponse> {
        return ResponseEntity.ok(demandeMaterielService.rejeter(id, request))
    }
}
