package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.DechetRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface DechetRecordRepository : JpaRepository<DechetRecord, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<DechetRecord>
    fun countByProjetId(projetId: Long): Long
}
