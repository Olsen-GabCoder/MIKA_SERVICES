package com.mikaservices.platform.modules.document.repository

import com.mikaservices.platform.common.enums.TypeDocument
import com.mikaservices.platform.modules.document.entity.Document
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DocumentRepository : JpaRepository<Document, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Document>

    fun findByUploadeParIdAndTypeDocumentIn(
        userId: Long,
        typeDocuments: List<TypeDocument>
    ): List<Document>
}
