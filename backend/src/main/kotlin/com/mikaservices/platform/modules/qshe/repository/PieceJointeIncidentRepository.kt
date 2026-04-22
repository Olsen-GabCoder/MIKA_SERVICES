package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.PieceJointeIncident
import org.springframework.data.jpa.repository.JpaRepository

interface PieceJointeIncidentRepository : JpaRepository<PieceJointeIncident, Long> {
    fun findByIncidentId(incidentId: Long): List<PieceJointeIncident>
}
