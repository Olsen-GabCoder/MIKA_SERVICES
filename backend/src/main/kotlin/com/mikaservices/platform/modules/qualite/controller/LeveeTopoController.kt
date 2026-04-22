package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.LeveeTopoCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.LeveeTopoUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.LeveeTopoResponse
import com.mikaservices.platform.modules.qualite.service.LeveeTopoService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qualite/levees-topo")
class LeveeTopoController(
    private val service: LeveeTopoService
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','TECHNICIEN_TOPOGRAPHIE')")
    fun create(@Valid @RequestBody request: LeveeTopoCreateRequest): LeveeTopoResponse =
        service.create(request)

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun list(
        @RequestParam(required = false) projetId: Long?,
        @PageableDefault(size = 20, sort = ["moisReference"]) pageable: Pageable
    ): Page<LeveeTopoResponse> = service.findAll(projetId, pageable)

    @GetMapping("/projet/{projetId}")
    @PreAuthorize("isAuthenticated()")
    fun listByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20, sort = ["moisReference"]) pageable: Pageable
    ): Page<LeveeTopoResponse> = service.findByProjet(projetId, pageable)

    @GetMapping("/projet/{projetId}/mois/{mois}")
    @PreAuthorize("isAuthenticated()")
    fun getByProjetAndMois(
        @PathVariable projetId: Long,
        @PathVariable mois: String
    ): LeveeTopoResponse? = service.findByProjetAndMois(projetId, mois)

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    fun getById(@PathVariable id: Long): LeveeTopoResponse = service.findById(id)

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE','INGENIEUR_QUALITE','CONTROLEUR_TECHNIQUE','TECHNICIEN_TOPOGRAPHIE')")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: LeveeTopoUpdateRequest
    ): LeveeTopoResponse = service.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)
}
