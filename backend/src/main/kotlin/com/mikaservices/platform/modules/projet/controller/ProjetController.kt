package com.mikaservices.platform.modules.projet.controller

import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.modules.projet.dto.request.AvancementEtudeProjetRequest
import com.mikaservices.platform.modules.projet.dto.request.CAPrevisionnelRealiseRequest
import com.mikaservices.platform.modules.projet.dto.request.PrevisionCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.PrevisionUpdateRequest
import com.mikaservices.platform.modules.projet.dto.request.ProjetCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.ProjetUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.AvancementEtudeProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.CAPrevisionnelRealiseResponse
import com.mikaservices.platform.modules.projet.dto.response.PrevisionResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetHistoriqueResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetResponse
import com.mikaservices.platform.modules.projet.dto.response.ProjetSummaryResponse
import com.mikaservices.platform.modules.projet.service.ProjetExportService
import com.mikaservices.platform.modules.projet.service.ProjetService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/projets")
@Tag(name = "Projets", description = "Gestion des projets et marchés")
class ProjetController(
    private val projetService: ProjetService,
    private val projetExportService: ProjetExportService
) {

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Créer un projet (réservé aux administrateurs)")
    fun create(@Valid @RequestBody request: ProjetCreateRequest): ResponseEntity<ProjetResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body<ProjetResponse>(projetService.create(request))
    }

    @GetMapping
    @Operation(summary = "Lister les projets (filtres optionnels : statut, type, clientId, responsableId)")
    fun findAll(
        @PageableDefault(size = 20) pageable: Pageable,
        @RequestParam(required = false) statut: StatutProjet?,
        @RequestParam(required = false) type: TypeProjet?,
        @RequestParam(required = false) clientId: Long?,
        @RequestParam(required = false) responsableId: Long?
    ): ResponseEntity<Page<ProjetSummaryResponse>> {
        val hasFilters = statut != null || type != null || clientId != null || responsableId != null
        return if (hasFilters) {
            ResponseEntity.ok<Page<ProjetSummaryResponse>>(projetService.findAllFiltered(statut, type, clientId, responsableId, pageable))
        } else {
            ResponseEntity.ok<Page<ProjetSummaryResponse>>(projetService.findAll(pageable))
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un projet par ID (détail complet)")
    fun findById(@PathVariable id: Long): ResponseEntity<ProjetResponse> {
        return ResponseEntity.ok<ProjetResponse>(projetService.findById(id))
    }

    @GetMapping("/{id}/historique")
    @Operation(summary = "Historique du projet (semaines passées : prévisions, points bloquants, résumés PV)")
    fun getHistorique(
        @PathVariable id: Long,
        @RequestParam(required = false, defaultValue = "52") maxSemaines: Int
    ): ResponseEntity<ProjetHistoriqueResponse> {
        return ResponseEntity.ok<ProjetHistoriqueResponse>(projetService.getHistorique(id, maxSemaines.coerceIn(1, 104)))
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des projets (filtres optionnels : statut, type, clientId, responsableId)")
    fun search(
        @RequestParam q: String,
        @PageableDefault(size = 20) pageable: Pageable,
        @RequestParam(required = false) statut: StatutProjet?,
        @RequestParam(required = false) type: TypeProjet?,
        @RequestParam(required = false) clientId: Long?,
        @RequestParam(required = false) responsableId: Long?
    ): ResponseEntity<Page<ProjetSummaryResponse>> {
        val hasFilters = statut != null || type != null || clientId != null || responsableId != null
        return if (hasFilters) {
            ResponseEntity.ok<Page<ProjetSummaryResponse>>(projetService.searchFiltered(q, statut, type, clientId, responsableId, pageable))
        } else {
            ResponseEntity.ok<Page<ProjetSummaryResponse>>(projetService.search(q, pageable))
        }
    }

    @GetMapping("/statut/{statut}")
    @Operation(summary = "Lister les projets par statut")
    fun findByStatut(@PathVariable statut: StatutProjet): ResponseEntity<List<ProjetSummaryResponse>> {
        return ResponseEntity.ok<List<ProjetSummaryResponse>>(projetService.findByStatut(statut))
    }

    @GetMapping("/responsable/{userId}")
    @Operation(summary = "Lister les projets par responsable")
    fun findByResponsable(@PathVariable userId: Long): ResponseEntity<List<ProjetSummaryResponse>> {
        return ResponseEntity.ok<List<ProjetSummaryResponse>>(projetService.findByResponsable(userId))
    }

    @GetMapping("/count/{statut}")
    @Operation(summary = "Compter les projets par statut")
    fun countByStatut(@PathVariable statut: StatutProjet): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(mapOf("count" to projetService.countByStatut(statut)))
    }

    @RequestMapping(value = ["/{id}"], method = [RequestMethod.PUT, RequestMethod.POST])
    @Operation(summary = "Mettre à jour un projet (PUT ou POST pour compatibilité)")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: ProjetUpdateRequest): ResponseEntity<ProjetResponse> {
        return ResponseEntity.ok<ProjetResponse>(projetService.update(id, request))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver un projet")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        projetService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Projet désactivé avec succès"))
    }

    @GetMapping("/{id}/avancement-etudes")
    @Operation(summary = "Obtenir l'avancement des études par phase")
    fun getAvancementEtudes(@PathVariable id: Long): ResponseEntity<List<AvancementEtudeProjetResponse>> {
        return ResponseEntity.ok<List<AvancementEtudeProjetResponse>>(projetService.getAvancementEtudes(id))
    }

    @PutMapping("/{id}/avancement-etudes")
    @Operation(summary = "Mettre à jour l'avancement des études par phase")
    fun saveAvancementEtudes(
        @PathVariable id: Long,
        @RequestBody requests: List<AvancementEtudeProjetRequest>
    ): ResponseEntity<List<AvancementEtudeProjetResponse>> {
        return ResponseEntity.ok<List<AvancementEtudeProjetResponse>>(projetService.saveAvancementEtudes(id, requests))
    }

    @GetMapping("/{id}/previsions")
    @Operation(summary = "Lister les prévisions du projet (tâches planifiées)")
    fun getPrevisions(@PathVariable id: Long): ResponseEntity<List<PrevisionResponse>> {
        return ResponseEntity.ok<List<PrevisionResponse>>(projetService.getPrevisions(id))
    }

    @PostMapping("/{id}/previsions")
    @Operation(summary = "Créer une prévision (tâche planifiée)")
    fun createPrevision(
        @PathVariable id: Long,
        @Valid @RequestBody request: PrevisionCreateRequest
    ): ResponseEntity<PrevisionResponse> {
        return ResponseEntity.status(HttpStatus.CREATED).body<PrevisionResponse>(projetService.createPrevision(id, request))
    }

    @PutMapping("/{id}/previsions/{previsionId}")
    @Operation(summary = "Modifier une prévision")
    fun updatePrevision(
        @PathVariable id: Long,
        @PathVariable previsionId: Long,
        @Valid @RequestBody request: PrevisionUpdateRequest
    ): ResponseEntity<PrevisionResponse> {
        return ResponseEntity.ok<PrevisionResponse>(projetService.updatePrevision(id, previsionId, request))
    }

    @DeleteMapping("/{id}/previsions/{previsionId}")
    @Operation(summary = "Supprimer une prévision")
    fun deletePrevision(
        @PathVariable id: Long,
        @PathVariable previsionId: Long
    ): ResponseEntity<Map<String, String>> {
        projetService.deletePrevision(id, previsionId)
        return ResponseEntity.ok(mapOf("message" to "Prévision supprimée"))
    }

    @GetMapping("/{id}/suivi-mensuel")
    @Operation(summary = "Obtenir le tableau de suivi mensuel (CA prévisionnel / réalisé)")
    fun getSuiviMensuel(@PathVariable id: Long): ResponseEntity<List<CAPrevisionnelRealiseResponse>> {
        return ResponseEntity.ok<List<CAPrevisionnelRealiseResponse>>(projetService.getSuiviMensuel(id))
    }

    @PutMapping("/{id}/suivi-mensuel")
    @Operation(summary = "Mettre à jour le tableau de suivi mensuel")
    fun saveSuiviMensuel(
        @PathVariable id: Long,
        @Valid @RequestBody requests: List<CAPrevisionnelRealiseRequest>
    ): ResponseEntity<List<CAPrevisionnelRealiseResponse>> {
        return ResponseEntity.ok<List<CAPrevisionnelRealiseResponse>>(projetService.saveSuiviMensuel(id, requests))
    }

    @PutMapping("/{id}/suivi-mensuel/replace")
    @Operation(summary = "Remplacer le tableau de suivi mensuel (mode manuel)")
    fun replaceSuiviMensuel(
        @PathVariable id: Long,
        @Valid @RequestBody requests: List<CAPrevisionnelRealiseRequest>
    ): ResponseEntity<List<CAPrevisionnelRealiseResponse>> {
        return ResponseEntity.ok<List<CAPrevisionnelRealiseResponse>>(projetService.replaceSuiviMensuel(id, requests))
    }

    @GetMapping("/{id}/export")
    @Operation(summary = "Télécharger le document du projet (Word, Excel)")
    fun exportDocument(
        @PathVariable id: Long,
        @RequestParam format: String
    ): ResponseEntity<Resource> {
        val exportResult: Pair<Resource, String> = projetExportService.exportDocument(id, format)
        val resource = exportResult.first
        val filename = exportResult.second
        val contentType = when (format.lowercase()) {
            "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            else -> "application/octet-stream"
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .body(resource)
    }
}
