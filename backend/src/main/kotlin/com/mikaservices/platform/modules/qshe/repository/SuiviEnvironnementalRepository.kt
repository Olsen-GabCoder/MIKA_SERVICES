package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.SuiviEnvironnemental
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface SuiviEnvironnementalRepository : JpaRepository<SuiviEnvironnemental, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<SuiviEnvironnemental>
    fun countByProjetId(projetId: Long): Long
}
