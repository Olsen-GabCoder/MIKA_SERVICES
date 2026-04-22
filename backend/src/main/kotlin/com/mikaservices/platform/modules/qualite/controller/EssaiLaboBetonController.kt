package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.EssaiLaboBetonCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.EssaiLaboBetonUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.EssaiLaboBetonResponse
import com.mikaservices.platform.modules.qualite.service.EssaiLaboBetonService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qualite/essais-labo")
class EssaiLaboBetonController(
    private val service: EssaiLaboBetonService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','TECHNICIEN_LABORATOIRE')")
    fun create(@Valid @RequestBody request: EssaiLaboBetonCreateRequest): EssaiLaboBetonResponse =
        service.create(request)

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun list(
        @RequestParam(required = false) projetId: Long?,
        @PageableDefault(size = 20, sort = ["moisReference"]) pageable: Pageable
    ): Page<EssaiLaboBetonResponse> = service.findAll(projetId, pageable)

    @GetMapping("/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun listByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20, sort = ["moisReference"]) pageable: Pageable
    ): Page<EssaiLaboBetonResponse> = service.findByProjet(projetId, pageable)

    @GetMapping("/projet/{projetId}/mois/{mois}")
    @PreAuthorize("isAuthenticated()")
    fun getByProjetAndMois(
        @PathVariable projetId: Long,
        @PathVariable mois: String
    ): EssaiLaboBetonResponse? = service.findByProjetAndMois(projetId, mois)

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    fun getById(@PathVariable id: Long): EssaiLaboBetonResponse = service.findById(id)

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','TECHNICIEN_LABORATOIRE')")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: EssaiLaboBetonUpdateRequest
    ): EssaiLaboBetonResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)
}
