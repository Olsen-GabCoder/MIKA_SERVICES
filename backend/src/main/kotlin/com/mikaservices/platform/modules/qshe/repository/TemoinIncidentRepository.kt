package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.TemoinIncident
import org.springframework.data.jpa.repository.JpaRepository

interface TemoinIncidentRepository : JpaRepository<TemoinIncident, Long> {
    fun findByIncidentId(incidentId: Long): List<TemoinIncident>
}
