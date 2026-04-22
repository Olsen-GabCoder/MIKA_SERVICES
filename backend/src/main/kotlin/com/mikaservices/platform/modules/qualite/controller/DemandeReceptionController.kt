package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.DemandeReceptionCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.DemandeReceptionUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.DemandeReceptionResponse
import com.mikaservices.platform.modules.qualite.dto.response.ReceptionSummaryResponse
import com.mikaservices.platform.modules.qualite.enums.NatureReception
import com.mikaservices.platform.modules.qualite.enums.SousTypeReception
import com.mikaservices.platform.modules.qualite.service.DemandeReceptionService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qualite/receptions")
class DemandeReceptionController(
    private val service: DemandeReceptionService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','ASSISTANT_QUALITE','TECHNICIEN_LABORATOIRE','TECHNICIEN_TOPOGRAPHIE','CHEF_PROJET','CHEF_CHANTIER')")
    fun create(@Valid @RequestBody request: DemandeReceptionCreateRequest): DemandeReceptionResponse =
        service.create(request)

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun list(
        @RequestParam(required = false) projetId: Long?,
        @RequestParam(required = false) nature: NatureReception?,
        @RequestParam(required = false) sousType: SousTypeReception?,
        @PageableDefault(size = 20, sort = ["dateDemande"]) pageable: Pageable
    ): Page<DemandeReceptionResponse> = service.findAll(projetId, nature, sousType, pageable)

    @GetMapping("/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun listByProjet(
        @PathVariable projetId: Long,
        @RequestParam(required = false) nature: NatureReception?,
        @RequestParam(required = false) sousType: SousTypeReception?,
        @PageableDefault(size = 20, sort = ["dateDemande"]) pageable: Pageable
    ): Page<DemandeReceptionResponse> = service.findByProjet(projetId, nature, sousType, pageable)

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    fun getById(@PathVariable id: Long): DemandeReceptionResponse = service.findById(id)

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','CHEF_PROJET','CHEF_CHANTIER')")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: DemandeReceptionUpdateRequest
    ): DemandeReceptionResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)

    @GetMapping("/summary/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun getSummary(
        @PathVariable projetId: Long,
        @RequestParam mois: String
    ): List<ReceptionSummaryResponse> = service.getSummary(projetId, mois)
}
