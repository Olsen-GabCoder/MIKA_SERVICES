package com.mikaservices.platform.modules.materiel.dto.response

import com.mikaservices.platform.common.enums.TypeDocumentEngin
import java.time.LocalDate
import java.time.LocalDateTime

data class DocumentEnginResponse(
    val id: Long,
    val enginId: Long,
    val enginCode: String,
    val typeDocument: TypeDocumentEngin,
    val nom: String,
    val urlFichier: String?,
    val dateExpiration: LocalDate?,
    val commentaire: String?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
