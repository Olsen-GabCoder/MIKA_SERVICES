package com.mikaservices.platform.modules.ia.controller

import com.mikaservices.platform.modules.ia.dto.RapportAnalyseResponse
import com.mikaservices.platform.modules.ia.service.RapportAnalyseService
import com.mikaservices.platform.modules.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/projets/{projetId}/analyse-rapport")
@Tag(name = "IA - Analyse de rapports", description = "Extraction IA des données de suivi depuis un rapport de chantier")
class RapportAnalyseController(
    private val rapportAnalyseService: RapportAnalyseService,
    private val userService: UserService
) {

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAnyRole('CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Analyser un rapport de chantier via IA et extraire les données de suivi")
    fun analyserRapport(
        @PathVariable projetId: Long,
        @RequestPart(required = false) file: MultipartFile?,
        @RequestPart(required = false) texte: String?
    ): ResponseEntity<RapportAnalyseResponse> {
        val userId = userService.getCurrentUser().id
        val response = rapportAnalyseService.analyserRapport(projetId, userId, file, texte)
        return ResponseEntity.ok(response)
    }
}
