package com.mikaservices.platform.modules.qualite.dto.response

import java.time.LocalDateTime

data class DocumentQualiteResponse(
    val id: Long,
    val codeDocument: String,
    val titre: String,
    val versionCourante: String,
    val description: String?,
    val nomOriginal: String?,
    val typeMime: String?,
    val tailleOctets: Long?,
    val actif: Boolean,
    val versions: List<VersionDocumentResponse>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)

data class DocumentQualiteListResponse(
    val id: Long,
    val codeDocument: String,
    val titre: String,
    val versionCourante: String,
    val nomOriginal: String?,
    val typeMime: String?,
    val actif: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?,
)

data class VersionDocumentResponse(
    val id: Long,
    val numeroVersion: String,
    val nomOriginal: String,
    val typeMime: String?,
    val tailleOctets: Long,
    val commentaire: String?,
    val auteurId: Long?,
    val auteurNom: String?,
    val createdAt: LocalDateTime?,
)
