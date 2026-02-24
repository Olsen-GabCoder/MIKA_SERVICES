package com.mikaservices.platform.modules.reunionhebdo.repository

import com.mikaservices.platform.common.enums.StatutReunion
import com.mikaservices.platform.modules.reunionhebdo.entity.ReunionHebdo
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface ReunionHebdoRepository : JpaRepository<ReunionHebdo, Long> {
    fun findByDateReunion(dateReunion: LocalDate): ReunionHebdo?
    fun findByStatut(statut: StatutReunion): List<ReunionHebdo>
    fun findAllByOrderByDateReunionDesc(pageable: Pageable): Page<ReunionHebdo>
}
