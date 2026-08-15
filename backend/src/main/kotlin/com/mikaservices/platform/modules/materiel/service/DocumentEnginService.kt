package com.mikaservices.platform.modules.materiel.service

import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.materiel.dto.request.DocumentEnginCreateRequest
import com.mikaservices.platform.modules.materiel.dto.request.DocumentEnginUpdateRequest
import com.mikaservices.platform.modules.materiel.dto.response.DocumentEnginResponse
import com.mikaservices.platform.modules.materiel.entity.DocumentEngin
import com.mikaservices.platform.modules.materiel.mapper.DocumentEnginMapper
import com.mikaservices.platform.modules.materiel.repository.DocumentEnginRepository
import com.mikaservices.platform.modules.materiel.repository.EnginRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class DocumentEnginService(
    private val documentRepository: DocumentEnginRepository,
    private val enginRepository: EnginRepository
) {
    private val logger = LoggerFactory.getLogger(DocumentEnginService::class.java)

    fun create(enginId: Long, request: DocumentEnginCreateRequest): DocumentEnginResponse {
        val engin = enginRepository.findById(enginId)
            .orElseThrow { ResourceNotFoundException("Engin non trouve avec l'ID: $enginId") }
        val doc = DocumentEngin(
            engin = engin,
            typeDocument = request.typeDocument,
            nom = request.nom,
            urlFichier = request.urlFichier,
            dateExpiration = request.dateExpiration,
            commentaire = request.commentaire
        )
        val saved = documentRepository.save(doc)
        logger.info("Document cree pour engin ${engin.code}: ${saved.nom}")
        return DocumentEnginMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<DocumentEnginResponse> {
        return documentRepository.findByEnginId(enginId, pageable)
            .map { DocumentEnginMapper.toResponse(it) }
    }

    fun update(enginId: Long, documentId: Long, request: DocumentEnginUpdateRequest): DocumentEnginResponse {
        val doc = getAndVerify(enginId, documentId)
        request.typeDocument?.let { doc.typeDocument = it }
        request.nom?.let { doc.nom = it }
        request.urlFichier?.let { doc.urlFichier = it }
        request.dateExpiration?.let { doc.dateExpiration = it }
        request.commentaire?.let { doc.commentaire = it }
        val saved = documentRepository.save(doc)
        logger.info("Document ${saved.id} mis a jour pour engin $enginId")
        return DocumentEnginMapper.toResponse(saved)
    }

    fun delete(enginId: Long, documentId: Long) {
        val doc = getAndVerify(enginId, documentId)
        documentRepository.delete(doc)
        logger.info("Document $documentId supprime pour engin $enginId")
    }

    private fun getAndVerify(enginId: Long, documentId: Long): DocumentEngin {
        val doc = documentRepository.findById(documentId)
            .orElseThrow { ResourceNotFoundException("Document non trouve avec l'ID: $documentId") }
        if (doc.engin.id != enginId) {
            throw ResourceNotFoundException("Le document $documentId n'appartient pas a l'engin $enginId")
        }
        return doc
    }
}
