package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.AgrementMarcheCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.AgrementMarcheUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.AgrementMarcheResponse
import com.mikaservices.platform.modules.qualite.dto.response.AgrementSummaryResponse
import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import com.mikaservices.platform.modules.qualite.service.AgrementMarcheService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qualite/agrements")
class AgrementMarcheController(
    private val service: AgrementMarcheService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','ASSISTANT_QUALITE','TECHNICIEN_LABORATOIRE','TECHNICIEN_TOPOGRAPHIE','CHEF_PROJET','CHEF_CHANTIER')")
    fun create(@Valid @RequestBody request: AgrementMarcheCreateRequest): AgrementMarcheResponse =
        service.create(request)

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun list(
        @RequestParam(required = false) projetId: Long?,
        @RequestParam(required = false) statut: StatutAgrement?,
        @PageableDefault(size = 20, sort = ["dateSoumission"]) pageable: Pageable
    ): Page<AgrementMarcheResponse> = service.findAll(projetId, statut, pageable)

    @GetMapping("/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun listByProjet(
        @PathVariable projetId: Long,
        @RequestParam(required = false) statut: StatutAgrement?,
        @PageableDefault(size = 20, sort = ["dateSoumission"]) pageable: Pageable
    ): Page<AgrementMarcheResponse> = service.findByProjet(projetId, statut, pageable)

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    fun getById(@PathVariable id: Long): AgrementMarcheResponse = service.findById(id)

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','CHEF_PROJET','CHEF_CHANTIER')")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: AgrementMarcheUpdateRequest
    ): AgrementMarcheResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    fun getStats(@RequestParam(required = false) projetId: Long?): Map<StatutAgrement, Long> =
        service.getStats(projetId)

    @GetMapping("/summary/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun getSummary(
        @PathVariable projetId: Long,
        @RequestParam mois: String
    ): AgrementSummaryResponse = service.getSummary(projetId, mois)
}
