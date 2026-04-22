package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.response.SyntheseMensuelleResponse
import com.mikaservices.platform.modules.qualite.service.SyntheseMensuelleService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/qualite/synthese")
class SyntheseMensuelleController(
    private val service: SyntheseMensuelleService
) {

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun getSynthese(
        @RequestParam(required = false) projetId: Long?,
        @RequestParam mois: String
    ): SyntheseMensuelleResponse = service.generer(projetId, mois)

    @GetMapping("/{projetId}/{mois}")
    @PreAuthorize("isAuthenticated()")
    fun getSyntheseByProjet(
        @PathVariable projetId: Long,
        @PathVariable mois: String
    ): SyntheseMensuelleResponse = service.generer(projetId, mois)
}
