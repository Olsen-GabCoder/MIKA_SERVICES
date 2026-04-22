package com.mikaservices.platform.modules.ia.repository

import com.mikaservices.platform.modules.ia.entity.AnalyseRapportLog
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface AnalyseRapportLogRepository : JpaRepository<AnalyseRapportLog, Long> {

    fun findByProjetIdOrderByTimestampDebutDesc(projetId: Long): List<AnalyseRapportLog>

    fun findByHashRapport(hashRapport: String): List<AnalyseRapportLog>

    fun countByProjetIdAndTimestampDebutAfter(projetId: Long, depuis: LocalDateTime): Long
}
