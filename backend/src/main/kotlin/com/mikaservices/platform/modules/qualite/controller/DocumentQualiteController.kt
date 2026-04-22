package com.mikaservices.platform.modules.qualite.controller

import com.mikaservices.platform.modules.qualite.dto.request.DocumentQualiteCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.DocumentQualiteUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.DocumentQualiteListResponse
import com.mikaservices.platform.modules.qualite.dto.response.DocumentQualiteResponse
import com.mikaservices.platform.modules.qualite.service.DocumentQualiteService
import jakarta.validation.Valid
import org.springframework.core.io.Resource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/qualite/documents")
class DocumentQualiteController(
    private val service: DocumentQualiteService
) {

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE')")
    fun create(
        @RequestParam titre: String,
        @RequestParam(required = false) description: String?,
        @RequestParam(required = false) file: MultipartFile?,
    ): DocumentQualiteResponse {
        val request = DocumentQualiteCreateRequest(
            titre = titre,
            description = description,
        )
        return service.create(request, file)
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    fun listAll(
        @RequestParam(required = false) actifsOnly: Boolean?,
        @PageableDefault(size = 20, sort = ["codeDocument"]) pageable: Pageable
    ): Page<DocumentQualiteListResponse> =
        if (actifsOnly == true) service.findActifs(pageable) else service.findAll(pageable)

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    fun getById(@PathVariable id: Long): DocumentQualiteResponse = service.findById(id)

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE')")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: DocumentQualiteUpdateRequest
    ): DocumentQualiteResponse = service.update(id, request)

    @PostMapping("/{id}/versions", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','RESPONSABLE_QUALITE')")
    fun ajouterVersion(
        @PathVariable id: Long,
        @RequestParam("file") file: MultipartFile,
        @RequestParam(required = false) commentaire: String?,
        @RequestParam(required = false) auteurId: Long?,
    ): DocumentQualiteResponse = service.ajouterVersion(id, file, commentaire, auteurId)

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    fun download(
        @PathVariable id: Long,
        @RequestParam(required = false) versionId: Long?,
    ): ResponseEntity<Resource> {
        val (resource, version) = service.download(id, versionId)

        val contentType = version.typeMime ?: MediaType.APPLICATION_OCTET_STREAM_VALUE

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${version.nomOriginal}\"")
            .body(resource)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    fun delete(@PathVariable id: Long) = service.delete(id)
}
