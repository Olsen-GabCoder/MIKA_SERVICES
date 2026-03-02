package com.mikaservices.platform.config.swagger

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.net.URI

/**
 * Redirige la racine du context-path (/api) et /swagger-ui.html vers Swagger UI.
 * Springdoc 2.x sert l’UI à /swagger-ui/index.html.
 */
@RestController
class ApiRootRedirectController {

    @GetMapping("", "/")
    fun redirectRootToSwagger(): ResponseEntity<Void> {
        return ResponseEntity.status(302)
            .location(URI.create("swagger-ui/index.html"))
            .build()
    }

    @GetMapping("/swagger-ui.html", "/swagger-ui.htm")
    fun redirectSwaggerUiHtml(): ResponseEntity<Void> {
        return ResponseEntity.status(302)
            .location(URI.create("swagger-ui/index.html"))
            .build()
    }
}
