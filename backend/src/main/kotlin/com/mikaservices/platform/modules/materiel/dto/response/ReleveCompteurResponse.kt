package com.mikaservices.platform.modules.materiel.dto.response

import java.time.LocalDate
import java.time.LocalDateTime

data class ReleveCompteurResponse(
    val id: Long,
    val enginId: Long,
    val dateReleve: LocalDate,
    val valeurHeures: Int,
    val relevePar: String?,
    val commentaire: String?,
    val photoUrl: String?,
    val createdAt: LocalDateTime?
)
