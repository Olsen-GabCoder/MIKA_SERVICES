package com.mikaservices.platform.modules.materiel.dto.response

import java.time.LocalDateTime

data class JournalAuditTerrainResponse(
    val id: Long,
    val acteurId: Long?,
    val acteurNom: String?,
    val action: String,
    val entiteType: String,
    val entiteId: Long?,
    val projetId: Long?,
    val latitude: Double?,
    val longitude: Double?,
    val payload: String?,
    val dateAction: LocalDateTime,
)
