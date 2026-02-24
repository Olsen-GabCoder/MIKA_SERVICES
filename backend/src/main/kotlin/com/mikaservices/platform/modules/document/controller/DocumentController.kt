package com.mikaservices.platform.modules.document.controller

import com.mikaservices.platform.common.enums.TypeDocument
import com.mikaservices.platform.modules.document.dto.response.DocumentResponse
import com.mikaservices.platform.modules.document.service.DocumentService
import com.mikaservices.platform.modules.user.repository.UserRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.core.io.Resource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/documents")
@Tag(name = "Documents", description = "Gestion documentaire et stockage de fichiers")
@SecurityRequirement(name = "bearerAuth")
class DocumentController(
    private val documentService: DocumentService,
    private val userRepository: UserRepository
) {
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Uploader un document")
    fun upload(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("typeDocument") typeDocument: TypeDocument,
        @RequestParam(required = false) description: String?,
        @RequestParam(required = false) projetId: Long?,
        @RequestParam(required = false) userId: Long?
    ): ResponseEntity<DocumentResponse> {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(documentService.upload(file, typeDocument, description, projetId, userId))
    }

    @GetMapping
    @Operation(summary = "Lister tous les documents")
    fun findAll(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<DocumentResponse>> {
        return ResponseEntity.ok(documentService.findAll(pageable))
    }

    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Documents d'un projet")
    fun findByProjet(
        @PathVariable projetId: Long,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<DocumentResponse>> {
        return ResponseEntity.ok(documentService.findByProjet(projetId, pageable))
    }

    @GetMapping("/me/cv")
    @Operation(summary = "Mes CV", description = "Liste des documents de type CV de l'utilisateur connecté")
    fun getMyCv(): ResponseEntity<List<DocumentResponse>> {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val user = userRepository.findByEmail(email)
            .orElse(null) ?: return ResponseEntity.ok(emptyList())
        val cvList = documentService.findByUploadeParIdAndTypeDocumentIn(user.id!!, listOf(TypeDocument.CV))
        return ResponseEntity.ok(cvList)
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un document")
    fun findById(@PathVariable id: Long): ResponseEntity<DocumentResponse> {
        return ResponseEntity.ok(documentService.findById(id))
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Télécharger un document")
    fun download(@PathVariable id: Long): ResponseEntity<Resource> {
        val (resource, doc) = documentService.download(id)
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(doc.typeMime ?: "application/octet-stream"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${doc.nomOriginal}\"")
            .body(resource)
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un document")
    fun delete(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        documentService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Document supprimé avec succès"))
    }
}
