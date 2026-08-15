package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.IncidentEngin
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface IncidentEnginRepository : JpaRepository<IncidentEngin, Long> {
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<IncidentEngin>
    fun findByEnginId(enginId: Long): List<IncidentEngin>
    fun countByEnginIdAndResoluFalse(enginId: Long): Long

    /** Tous les incidents non resolus, tries par gravite (CRITIQUE d'abord) puis date desc */
    @Query("SELECT i FROM IncidentEngin i JOIN FETCH i.engin e WHERE i.resolu = false AND e.actif = true ORDER BY i.gravite ASC, i.dateIncident DESC")
    fun findIncidentsNonResolus(): List<IncidentEngin>
}
