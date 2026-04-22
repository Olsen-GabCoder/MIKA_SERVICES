package com.mikaservices.platform.modules.qualite.mapper

import com.mikaservices.platform.modules.qualite.dto.response.DocumentQualiteListResponse
import com.mikaservices.platform.modules.qualite.dto.response.DocumentQualiteResponse
import com.mikaservices.platform.modules.qualite.dto.response.VersionDocumentResponse
import com.mikaservices.platform.modules.qualite.entity.DocumentQualite
import com.mikaservices.platform.modules.qualite.entity.VersionDocumentQualite

object DocumentQualiteMapper {

    fun toResponse(e: DocumentQualite): DocumentQualiteResponse {
        val latestVersion = e.versions.maxByOrNull { it.createdAt ?: java.time.LocalDateTime.MIN }
        return DocumentQualiteResponse(
            id = e.id!!,
            codeDocument = e.codeDocument,
            titre = e.titre,
            versionCourante = e.versionCourante,
            description = e.description,
            nomOriginal = e.nomOriginal,
            typeMime = e.typeMime,
            tailleOctets = latestVersion?.tailleOctets,
            actif = e.actif,
            versions = e.versions.sortedByDescending { it.createdAt }.map(::toVersionResponse),
            createdAt = e.createdAt,
            updatedAt = e.updatedAt,
        )
    }

    fun toListResponse(e: DocumentQualite): DocumentQualiteListResponse = DocumentQualiteListResponse(
        id = e.id!!,
        codeDocument = e.codeDocument,
        titre = e.titre,
        versionCourante = e.versionCourante,
        nomOriginal = e.nomOriginal,
        typeMime = e.typeMime,
        actif = e.actif,
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )

    private fun toVersionResponse(v: VersionDocumentQualite): VersionDocumentResponse = VersionDocumentResponse(
        id = v.id!!,
        numeroVersion = v.numeroVersion,
        nomOriginal = v.nomOriginal,
        typeMime = v.typeMime,
        tailleOctets = v.tailleOctets,
        commentaire = v.commentaire,
        auteurId = v.auteur?.id,
        auteurNom = v.auteur?.let { "${it.prenom ?: ""} ${it.nom}".trim() },
        createdAt = v.createdAt,
    )
}
