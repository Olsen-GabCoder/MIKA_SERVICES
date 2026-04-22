package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.*
import com.mikaservices.platform.modules.qualite.dto.response.EvenementQualiteListResponse
import com.mikaservices.platform.modules.qualite.dto.response.EvenementQualiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.SectionResponse
import com.mikaservices.platform.modules.qualite.enums.StatutEvenement
import com.mikaservices.platform.modules.qualite.enums.TypeEvenement
import com.mikaservices.platform.modules.qualite.service.EvenementQualiteService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qualite/evenements")
class EvenementQualiteController(
    private val service: EvenementQualiteService
) {

    // ==================== CRUD ====================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','ASSISTANT_QUALITE','CHEF_PROJET','CHEF_CHANTIER')")
    fun create(@Valid @RequestBody request: EvenementQualiteCreateRequest): EvenementQualiteResponse =
        service.create(request)

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun list(
        @RequestParam(required = false) projetId: Long?,
        @RequestParam(required = false) type: TypeEvenement?,
        @RequestParam(required = false) statut: StatutEvenement?,
        @PageableDefault(size = 20, sort = ["createdAt"]) pageable: Pageable
    ): Page<EvenementQualiteListResponse> = service.findAll(projetId, type, statut, pageable)

    @GetMapping("/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun listByProjet(
        @PathVariable projetId: Long,
        @RequestParam(required = false) type: TypeEvenement?,
        @RequestParam(required = false) statut: StatutEvenement?,
        @PageableDefault(size = 20, sort = ["createdAt"]) pageable: Pageable
    ): Page<EvenementQualiteListResponse> = service.findByProjet(projetId, type, statut, pageable)

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    fun getById(@PathVariable id: Long): EvenementQualiteResponse = service.findById(id)

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','CHEF_PROJET')")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: EvenementQualiteUpdateRequest
    ): EvenementQualiteResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)

    // ==================== Workflow sections ====================

    @PutMapping("/{id}/sections/{numSection}/contenu")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','ASSISTANT_QUALITE','CHEF_PROJET','CHEF_CHANTIER')")
    fun updateSectionContenu(
        @PathVariable id: Long,
        @PathVariable numSection: Int,
        @Valid @RequestBody request: SectionContenuRequest
    ): SectionResponse = service.updateSectionContenu(id, numSection, request)

    @PostMapping("/{id}/sections/{numSection}/signer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','ASSISTANT_QUALITE','CHEF_PROJET','CHEF_CHANTIER')")
    fun signerSection(
        @PathVariable id: Long,
        @PathVariable numSection: Int,
        @Valid @RequestBody request: SignatureSectionRequest
    ): EvenementQualiteResponse = service.signerSection(id, numSection, request)

    @PostMapping("/{id}/sections/6/signer-collegiale")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','DIRECTEUR_TECHNIQUE','CHEF_CHANTIER')")
    fun signerCollegiale(
        @PathVariable id: Long,
        @Valid @RequestBody request: SignatureCollegialeRequest
    ): EvenementQualiteResponse = service.signerCollegiale(id, request)

    // ==================== Stats ====================

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    fun getStats(@RequestParam(required = false) projetId: Long?): Map<StatutEvenement, Long> =
        service.getStats(projetId)

    @GetMapping("/stats/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun getStatsByProjet(@PathVariable projetId: Long): Map<StatutEvenement, Long> =
        service.getStatsByProjet(projetId)
}
