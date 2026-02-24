package com.mikaservices.platform.modules.meteo.controller

import com.mikaservices.platform.modules.meteo.dto.response.MeteoResponse
import com.mikaservices.platform.modules.meteo.dto.response.PrevisionResponse
import com.mikaservices.platform.modules.meteo.service.MeteoService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/meteo")
@Tag(name = "Météo", description = "Conditions météorologiques et prévisions pour les chantiers")
class MeteoController(
    private val meteoService: MeteoService
) {
    @GetMapping("/actuelle")
    @Operation(summary = "Météo actuelle")
    fun getMeteoActuelle(@RequestParam(required = false) ville: String?): ResponseEntity<MeteoResponse> {
        return ResponseEntity.ok(meteoService.getMeteoActuelle(ville))
    }

    @GetMapping("/previsions")
    @Operation(summary = "Prévisions météo sur 5 jours")
    fun getPrevisions(@RequestParam(required = false) ville: String?): ResponseEntity<PrevisionResponse> {
        return ResponseEntity.ok(meteoService.getPrevisions(ville))
    }
}
