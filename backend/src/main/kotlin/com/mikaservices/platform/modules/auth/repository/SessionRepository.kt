package com.mikaservices.platform.modules.auth.repository

import com.mikaservices.platform.modules.auth.entity.Session
import com.mikaservices.platform.modules.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

@Repository
interface SessionRepository : JpaRepository<Session, Long> {
    fun findByToken(token: String): Optional<Session>
    fun findByRefreshToken(refreshToken: String): Optional<Session>
    fun findByUserAndActiveTrue(user: User): List<Session>
    
    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.active = true")
    fun findActiveSessionsByUserId(userId: Long): List<Session>

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.ipAddress = :ip AND s.userAgent = :ua AND s.active = true ORDER BY s.lastActivity DESC")
    fun findActiveByUserIdAndIpAndUserAgent(userId: Long, ip: String, ua: String): List<Session>

    @Query("SELECT COUNT(s) FROM Session s WHERE s.user.id = :userId AND s.active = true")
    fun countActiveByUserId(userId: Long): Long

    @Query("SELECT COUNT(s) FROM Session s WHERE s.user.id = :userId")
    fun countByUser_Id(userId: Long): Long

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.active = true ORDER BY s.lastActivity ASC")
    fun findActiveSessionsByUserIdOrderByLastActivityAsc(userId: Long): List<Session>
    
    @Modifying
    @Query("UPDATE Session s SET s.active = false WHERE s.user.id = :userId")
    fun deactivateAllUserSessions(userId: Long)
    
    @Modifying
    @Query("DELETE FROM Session s WHERE s.dateExpiration < :now")
    fun deleteExpiredSessions(now: LocalDateTime)
    
    @Modifying
    @Query("UPDATE Session s SET s.active = false WHERE s.dateExpiration < :now")
    fun deactivateExpiredSessions(now: LocalDateTime)

    @Modifying
    @Query("DELETE FROM Session s WHERE s.user.id = :userId")
    fun deleteAllByUserId(userId: Long)
}
