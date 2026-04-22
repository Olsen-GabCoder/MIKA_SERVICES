package com.mikaservices.platform.modules.qualite.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.qualite.dto.request.DocumentQualiteCreateRequest
import com.mikaservices.platform.modules.qualite.dto.request.DocumentQualiteUpdateRequest
import com.mikaservices.platform.modules.qualite.dto.response.DocumentQualiteListResponse
import com.mikaservices.platform.modules.qualite.dto.response.DocumentQualiteResponse
import com.mikaservices.platform.modules.qualite.entity.DocumentQualite
import com.mikaservices.platform.modules.qualite.entity.VersionDocumentQualite
import com.mikaservices.platform.modules.qualite.mapper.DocumentQualiteMapper
import com.mikaservices.platform.modules.qualite.repository.DocumentQualiteRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import jakarta.persistence.EntityNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.UUID

@Service
@Transactional
class DocumentQualiteService(
    private val repository: DocumentQualiteRepository,
    private val userRepository: UserRepository,
) {
    private val logger = LoggerFactory.getLogger(DocumentQualiteService::class.java)

    @Value("\${app.upload.dir:uploads}")
    private lateinit var uploadDir: String

    private fun getUploadPath(): Path {
        val uploadPath = Paths.get(uploadDir).resolve("qualite-documents").toAbsolutePath().normalize()
        Files.createDirectories(uploadPath)
        return uploadPath
    }

    private fun storeFile(file: MultipartFile): Triple<String, String, Path> {
        val uploadPath = getUploadPath()
        val originalFilename = file.originalFilename ?: "fichier"
        val extension = originalFilename.substringAfterLast(".", "")
        val storedFilename = "${UUID.randomUUID()}.$extension"
        val targetPath = uploadPath.resolve(storedFilename)

        Files.copy(file.inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING)

        return Triple(originalFilename, storedFilename, targetPath)
    }

    private fun generateCode(): String {
        val count = repository.count() + 1
        return "MS-QUA-DOC-${String.format("%04d", count)}"
    }

    fun create(request: DocumentQualiteCreateRequest, file: MultipartFile?): DocumentQualiteResponse {
        val code = generateCode()

        val doc = DocumentQualite(
            codeDocument = code,
            titre = request.titre,
            description = request.description,
        )

        val saved = repository.save(doc)

        // Créer la version 1 si un fichier est fourni
        if (file != null && !file.isEmpty) {
            val (originalFilename, storedFilename, targetPath) = storeFile(file)

            saved.nomOriginal = originalFilename
            saved.nomStockage = storedFilename
            saved.typeMime = file.contentType

            saved.versions.add(
                VersionDocumentQualite(
                    document = saved,
                    numeroVersion = "1",
                    nomOriginal = originalFilename,
                    nomStockage = storedFilename,
                    cheminStockage = targetPath.toString(),
                    typeMime = file.contentType,
                    tailleOctets = file.size,
                    commentaire = "Version initiale",
                )
            )
            repository.save(saved)
            logger.info("Document qualité créé avec fichier: $originalFilename (${file.size} octets)")
        }

        return DocumentQualiteMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<DocumentQualiteListResponse> =
        repository.findAll(pageable).map(DocumentQualiteMapper::toListResponse)

    @Transactional(readOnly = true)
    fun findActifs(pageable: Pageable): Page<DocumentQualiteListResponse> =
        repository.findByActif(true, pageable).map(DocumentQualiteMapper::toListResponse)

    @Transactional(readOnly = true)
    fun findById(id: Long): DocumentQualiteResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("DocumentQualite $id introuvable") }
        return DocumentQualiteMapper.toResponse(entity)
    }

    fun update(id: Long, request: DocumentQualiteUpdateRequest): DocumentQualiteResponse {
        val entity = repository.findById(id)
            .orElseThrow { EntityNotFoundException("DocumentQualite $id introuvable") }

        request.titre?.let { entity.titre = it }
        request.description?.let { entity.description = it }
        request.actif?.let { entity.actif = it }

        return DocumentQualiteMapper.toResponse(repository.save(entity))
    }

    fun ajouterVersion(id: Long, file: MultipartFile, commentaire: String?, auteurId: Long?): DocumentQualiteResponse {
        val doc = repository.findById(id)
            .orElseThrow { EntityNotFoundException("DocumentQualite $id introuvable") }

        val auteur = auteurId?.let {
            userRepository.findById(it).orElseThrow { EntityNotFoundException("Utilisateur $it introuvable") }
        }

        val (originalFilename, storedFilename, targetPath) = storeFile(file)

        val nextVersion = (doc.versionCourante.toIntOrNull()?.plus(1) ?: (doc.versions.size + 1)).toString()

        doc.versions.add(
            VersionDocumentQualite(
                document = doc,
                numeroVersion = nextVersion,
                nomOriginal = originalFilename,
                nomStockage = storedFilename,
                cheminStockage = targetPath.toString(),
                typeMime = file.contentType,
                tailleOctets = file.size,
                commentaire = commentaire,
                auteur = auteur,
            )
        )
        doc.versionCourante = nextVersion
        doc.nomOriginal = originalFilename
        doc.nomStockage = storedFilename
        doc.typeMime = file.contentType

        logger.info("Nouvelle version $nextVersion ajoutée au document ${doc.codeDocument}: $originalFilename (${file.size} octets)")
        return DocumentQualiteMapper.toResponse(repository.save(doc))
    }

    @Transactional(readOnly = true)
    fun download(documentId: Long, versionId: Long?): Pair<Resource, VersionDocumentQualite> {
        val doc = repository.findById(documentId)
            .orElseThrow { EntityNotFoundException("DocumentQualite $documentId introuvable") }

        val version = if (versionId != null) {
            doc.versions.find { it.id == versionId }
                ?: throw ResourceNotFoundException("Version $versionId introuvable pour le document $documentId")
        } else {
            // Télécharger la dernière version
            doc.versions.maxByOrNull { it.createdAt ?: java.time.LocalDateTime.MIN }
                ?: throw ResourceNotFoundException("Aucune version disponible pour le document $documentId")
        }

        val filePath = Path.of(version.cheminStockage)
        val resource = UrlResource(filePath.toUri())

        if (!resource.exists()) {
            throw ResourceNotFoundException("Fichier physique non trouvé: ${version.nomOriginal}")
        }

        return Pair(resource, version)
    }

    fun delete(id: Long) {
        val doc = repository.findById(id)
            .orElseThrow { EntityNotFoundException("DocumentQualite $id introuvable") }

        // Supprimer les fichiers physiques de toutes les versions
        doc.versions.forEach { version ->
            try {
                val filePath = Path.of(version.cheminStockage)
                Files.deleteIfExists(filePath)
            } catch (e: Exception) {
                logger.warn("Impossible de supprimer le fichier physique: ${version.cheminStockage}", e)
            }
        }

        repository.deleteById(id)
        logger.info("Document qualité supprimé: ${doc.codeDocument}")
    }
}
