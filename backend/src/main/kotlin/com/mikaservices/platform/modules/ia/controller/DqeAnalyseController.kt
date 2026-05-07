package com.mikaservices.platform.modules.ia.controller

import com.mikaservices.platform.modules.ia.dto.DqeAnalyseResponse
import com.mikaservices.platform.modules.ia.service.DqeAnalyseService
import com.mikaservices.platform.modules.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/projets/{projetId}/analyse-dqe")
@Tag(name = "IA - Analyse DQE", description = "Extraction IA d'un Devis Quantitatif et Estimatif depuis un fichier")
class DqeAnalyseController(
    private val dqeAnalyseService: DqeAnalyseService,
    private val userService: UserService
) {

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAnyRole('CHEF_PROJET','CHEF_CHANTIER','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Analyser un fichier DQE via IA et extraire chapitres et lignes")
    fun analyserDqe(
        @PathVariable projetId: Long,
        @RequestPart(required = false) file: MultipartFile?,
        @RequestPart(required = false) texte: String?
    ): ResponseEntity<DqeAnalyseResponse> {
        val userId = userService.getCurrentUser().id
        val response = dqeAnalyseService.analyserDqe(projetId, userId, file, texte)
        return ResponseEntity.ok(response)
    }
}
