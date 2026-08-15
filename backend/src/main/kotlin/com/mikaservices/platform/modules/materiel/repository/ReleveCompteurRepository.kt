package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.ReleveCompteur
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface ReleveCompteurRepository : JpaRepository<ReleveCompteur, Long> {
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<ReleveCompteur>
    fun findByEnginIdOrderByDateReleveDesc(enginId: Long): List<ReleveCompteur>
    fun findFirstByEnginIdOrderByDateReleveDesc(enginId: Long): ReleveCompteur?
    fun findByEnginIdAndDateReleveGreaterThanEqualOrderByDateReleveAsc(enginId: Long, depuis: LocalDate): List<ReleveCompteur>
}
