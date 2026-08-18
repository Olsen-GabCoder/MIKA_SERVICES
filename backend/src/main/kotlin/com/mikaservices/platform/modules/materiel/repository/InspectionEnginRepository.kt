package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.InspectionEngin
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface InspectionEnginRepository : JpaRepository<InspectionEngin, Long> {
    fun findByEnginIdOrderByDateInspectionDesc(enginId: Long, pageable: Pageable): Page<InspectionEngin>
    fun existsByEnginIdAndDateInspection(enginId: Long, dateInspection: LocalDate): Boolean
}
