package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.VictimeIncident
import org.springframework.data.jpa.repository.JpaRepository

interface VictimeIncidentRepository : JpaRepository<VictimeIncident, Long> {
    fun findByIncidentId(incidentId: Long): List<VictimeIncident>
}
