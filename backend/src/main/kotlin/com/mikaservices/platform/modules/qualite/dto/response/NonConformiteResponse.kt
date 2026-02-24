package com.mikaservices.platform.modules.qualite.dto.response

import com.mikaservices.platform.common.enums.GraviteNonConformite
import com.mikaservices.platform.common.enums.StatutNonConformite
import com.mikaservices.platform.modules.projet.dto.response.ProjetUserSummary
import java.time.LocalDate
import java.time.LocalDateTime

data class NonConformiteResponse(
    val id: Long,
    val controleQualiteId: Long,
    val controleReference: String,
    val reference: String,
    val titre: String,
    val description: String?,
    val gravite: GraviteNonConformite,
    val statut: StatutNonConformite,
    val responsableTraitement: ProjetUserSummary?,
    val causeIdentifiee: String?,
    val actionCorrective: String?,
    val dateDetection: LocalDate?,
    val dateEcheanceCorrection: LocalDate?,
    val dateCloture: LocalDate?,
    val preuveCorrection: String?,
    val enRetard: Boolean,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
