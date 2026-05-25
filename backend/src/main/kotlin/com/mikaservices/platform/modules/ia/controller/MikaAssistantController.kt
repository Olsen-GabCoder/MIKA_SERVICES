package com.mikaservices.platform.modules.ia.controller

import com.mikaservices.platform.modules.ia.dto.MikaAssistantRequest
import com.mikaservices.platform.modules.ia.dto.MikaAssistantResponse
import com.mikaservices.platform.modules.ia.service.MikaAssistantService
import com.mikaservices.platform.modules.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/assistant")
@Tag(name = "IA - Assistant Mika", description = "Assistant IA contextuel transversal")
class MikaAssistantController(
    private val mikaAssistantService: MikaAssistantService,
    private val userService: UserService
) {

    @PostMapping("/ask")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Poser une question a l'assistant Mika avec le contexte de la page courante")
    fun ask(@RequestBody request: MikaAssistantRequest): ResponseEntity<MikaAssistantResponse> {
        val user = userService.getCurrentUser()
        val response = mikaAssistantService.ask(request, user)
        return ResponseEntity.ok(response)
    }
}
