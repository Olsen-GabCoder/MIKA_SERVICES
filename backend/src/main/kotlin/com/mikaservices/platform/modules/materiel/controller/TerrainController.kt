package com.mikaservices.platform.modules.materiel.controller

import com.mikaservices.platform.modules.materiel.dto.request.ConsommationCarburantCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.IncidentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.InspectionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.PositionEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.ReleveCompteurCreateRequest
import com.mikaservices.platform.modules.materiel.dto.response.TerrainEnginResponse
import com.mikaservices.platform.modules.materiel.service.TerrainService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

/**
 * API de l'application mobile terrain — réservée aux conducteurs d'engins
 * (+ logistique/admins pour supervision et tests).
 * Les conducteurs n'ont accès qu'à ces endpoints : aucun autre @PreAuthorize
 * de la plateforme ne référence le rôle CONDUCTEUR.
 */
@RestController
@RequestMapping("/terrain")
@PreAuthorize("hasAnyRole('CONDUCTEUR','LOGISTIQUE','ADMIN','SUPER_ADMIN')")
@Tag(name = "Terrain", description = "Application mobile terrain (conducteurs)")
class TerrainController(
    private val terrainService: TerrainService
) {

    @GetMapping("/mes-engins")
    @Operation(summary = "Engins actuellement affectés aux chantiers (EN_COURS)")
    fun mesEngins(): ResponseEntity<List<TerrainEnginResponse>> =
        ResponseEntity.ok(terrainService.mesEngins())

    @GetMapping("/engins/scan")
    @Operation(summary = "Résoudre un engin depuis un scan QR (code, token ou URL)")
    fun scan(@RequestParam q: String): ResponseEntity<TerrainEnginResponse> =
        ResponseEntity.ok(terrainService.scan(q))

    @PostMapping("/engins/{id}/position")
    @Operation(summary = "Confirmer la position de l'engin (source QR_SCAN)")
    fun confirmerPosition(
        @PathVariable id: Long,
        @Valid @RequestBody request: PositionEnginCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.confirmerPosition(id, request))

    @PostMapping("/engins/{id}/releve")
    @Operation(summary = "Relevé compteur horaire")
    fun creerReleve(
        @PathVariable id: Long,
        @Valid @RequestBody request: ReleveCompteurCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.creerReleve(id, request))

    @PostMapping("/engins/{id}/ravitaillement")
    @Operation(summary = "Déclarer un plein de carburant")
    fun creerRavitaillement(
        @PathVariable id: Long,
        @Valid @RequestBody request: ConsommationCarburantCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.creerRavitaillement(id, request))

    @PostMapping("/engins/{id}/incident")
    @Operation(summary = "Signaler un problème (panne, casse, fuite…)")
    fun signalerIncident(
        @PathVariable id: Long,
        @Valid @RequestBody request: IncidentEnginCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.signalerIncident(id, request))

    @PostMapping("/engins/{id}/inspection")
    @Operation(summary = "Inspection quotidienne (checklist + signature)")
    fun creerInspection(
        @PathVariable id: Long,
        @Valid @RequestBody request: InspectionEnginCreateRequest
    ) = ResponseEntity.status(HttpStatus.CREATED).body(terrainService.creerInspection(id, request))
}
