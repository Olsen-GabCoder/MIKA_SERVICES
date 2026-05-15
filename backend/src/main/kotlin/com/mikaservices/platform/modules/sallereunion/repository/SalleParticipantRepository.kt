package com.mikaservices.platform.modules.sallereunion.repository

import com.mikaservices.platform.modules.sallereunion.entity.SalleParticipant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface SalleParticipantRepository : JpaRepository<SalleParticipant, Long> {

    fun findBySalleIdAndUserIdAndLeftAtIsNull(salleId: Long, userId: Long): SalleParticipant?

    fun findBySalleIdAndLeftAtIsNull(salleId: Long): List<SalleParticipant>

    /** Compte les participants distincts ayant rejoint la salle depuis une date donnee. */
    @Query("SELECT COUNT(DISTINCT p.user.id) FROM SalleParticipant p WHERE p.salle.id = :salleId AND p.joinedAt >= :since")
    fun countDistinctUsersSince(salleId: Long, since: LocalDateTime): Long

    /** Force le depart des sessions fantomes (pas de heartbeat depuis cutoff). */
    @Modifying
    @Query("UPDATE SalleParticipant p SET p.leftAt = :now WHERE p.leftAt IS NULL AND p.lastHeartbeatAt < :cutoff")
    fun forceLeaveStaleParticipants(cutoff: LocalDateTime, now: LocalDateTime): Int
}
