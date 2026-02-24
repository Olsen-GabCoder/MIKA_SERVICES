package com.mikaservices.platform.modules.document.service

import com.mikaservices.platform.common.enums.TypeDocument
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.document.dto.response.DocumentResponse
import com.mikaservices.platform.modules.document.entity.Document
import com.mikaservices.platform.modules.document.mapper.DocumentMapper
import com.mikaservices.platform.modules.document.repository.DocumentRepository
import com.mikaservices.platform.modules.projet.repository.ProjetRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
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
class DocumentService(
    private val documentRepository: DocumentRepository,
    private val projetRepository: ProjetRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(DocumentService::class.java)

    @Value("\${app.upload.dir:uploads}")
    private lateinit var uploadDir: String

    fun upload(
        file: MultipartFile,
        typeDocument: TypeDocument,
        description: String?,
        projetId: Long?,
        userId: Long?
    ): DocumentResponse {
        val uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize()
        Files.createDirectories(uploadPath)

        val originalFilename = file.originalFilename ?: "fichier"
        val extension = originalFilename.substringAfterLast(".", "")
        val storedFilename = "${UUID.randomUUID()}.$extension"
        val targetPath = uploadPath.resolve(storedFilename)

        Files.copy(file.inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING)

        val document = Document(
            nomFichier = storedFilename,
            nomOriginal = originalFilename,
            cheminStockage = targetPath.toString(),
            typeMime = file.contentType,
            tailleOctets = file.size,
            typeDocument = typeDocument,
            description = description
        )

        projetId?.let {
            document.projet = projetRepository.findById(it)
                .orElseThrow { ResourceNotFoundException("Projet non trouvé avec l'ID: $it") }
        }
        userId?.let {
            document.uploadePar = userRepository.findById(it)
                .orElseThrow { ResourceNotFoundException("Utilisateur non trouvé avec l'ID: $it") }
        }

        val saved = documentRepository.save(document)
        logger.info("Document uploadé: ${saved.nomOriginal} (${saved.tailleOctets} octets)")
        return DocumentMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByProjet(projetId: Long, pageable: Pageable): Page<DocumentResponse> {
        return documentRepository.findByProjetId(projetId, pageable).map { DocumentMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<DocumentResponse> {
        return documentRepository.findAll(pageable).map { DocumentMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): DocumentResponse {
        val doc = documentRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Document non trouvé avec l'ID: $id") }
        return DocumentMapper.toResponse(doc)
    }

    @Transactional(readOnly = true)
    fun findByUploadeParIdAndTypeDocumentIn(userId: Long, types: List<TypeDocument>): List<DocumentResponse> {
        if (types.isEmpty()) return emptyList()
        return documentRepository.findByUploadeParIdAndTypeDocumentIn(userId, types).map { DocumentMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun download(id: Long): Pair<Resource, Document> {
        val doc = documentRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Document non trouvé avec l'ID: $id") }

        val filePath = Path.of(doc.cheminStockage)
        val resource = UrlResource(filePath.toUri())

        if (!resource.exists()) {
            throw ResourceNotFoundException("Fichier physique non trouvé: ${doc.nomOriginal}")
        }

        return Pair(resource, doc)
    }

    fun delete(id: Long) {
        val doc = documentRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Document non trouvé avec l'ID: $id") }

        // Supprimer le fichier physique
        try {
            val filePath = Path.of(doc.cheminStockage)
            Files.deleteIfExists(filePath)
        } catch (e: Exception) {
            logger.warn("Impossible de supprimer le fichier physique: ${doc.cheminStockage}", e)
        }

        documentRepository.delete(doc)
        logger.info("Document supprimé: ${doc.nomOriginal}")
    }
}
