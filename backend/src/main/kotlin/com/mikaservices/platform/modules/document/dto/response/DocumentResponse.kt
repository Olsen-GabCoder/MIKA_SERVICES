package com.mikaservices.platform.modules.document.dto.response

import com.mikaservices.platform.common.enums.TypeDocument
import java.time.LocalDateTime

data class DocumentResponse(
    val id: Long,
    val nomOriginal: String,
    val typeMime: String?,
    val tailleOctets: Long,
    val typeDocument: TypeDocument,
    val description: String?,
    val projetId: Long?,
    val projetNom: String?,
    val uploadeParNom: String?,
    val downloadUrl: String,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
) {
    val tailleFormatee: String
        get() = when {
            tailleOctets < 1024 -> "$tailleOctets o"
            tailleOctets < 1024 * 1024 -> "${tailleOctets / 1024} Ko"
            else -> "${tailleOctets / (1024 * 1024)} Mo"
        }
}
