package com.mikaservices.platform.modules.reunionhebdo.repository

import com.mikaservices.platform.modules.reunionhebdo.entity.ParticipantReunion
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ParticipantReunionRepository : JpaRepository<ParticipantReunion, Long> {
    fun findByReunionId(reunionId: Long): List<ParticipantReunion>
    fun deleteByReunionId(reunionId: Long)
}
