package com.mikaservices.platform.modules.reunionhebdo.repository

import com.mikaservices.platform.modules.reunionhebdo.entity.ParticipantReunion
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface ParticipantReunionRepository : JpaRepository<ParticipantReunion, Long> {
    fun findByReunionId(reunionId: Long): List<ParticipantReunion>

    @Modifying
    @Query("DELETE FROM ParticipantReunion p WHERE p.reunion.id = :reunionId")
    fun deleteByReunionId(@Param("reunionId") reunionId: Long): Int
}
