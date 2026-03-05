package com.mikaservices.platform.modules.user.repository

import com.mikaservices.platform.modules.user.entity.AuditLog
import com.mikaservices.platform.modules.user.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface AuditLogRepository : JpaRepository<AuditLog, Long> {
    fun findByUser(user: User, pageable: Pageable): Page<AuditLog>

    @Query("SELECT a FROM AuditLog a ORDER BY a.createdAt DESC")
    fun findAllDesc(pageable: Pageable): Page<AuditLog>

    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:userId IS NULL OR a.user.id = :userId)
          AND (:module IS NULL OR a.module = :module)
          AND (:#{#actions == null || #actions.isEmpty()} = true OR a.action IN :actions)
          AND (:startDate IS NULL OR a.createdAt >= :startDate)
          AND (:endDate IS NULL OR a.createdAt <= :endDate)
        ORDER BY a.createdAt DESC
    """)
    fun findFiltered(
        userId: Long?,
        module: String?,
        actions: List<String>?,
        startDate: LocalDateTime?,
        endDate: LocalDateTime?,
        pageable: Pageable
    ): Page<AuditLog>

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.user.id = :userId AND a.action = :action")
    fun countByUserIdAndAction(userId: Long, action: String): Long

    @Query("SELECT MIN(a.createdAt) FROM AuditLog a WHERE a.user.id = :userId AND a.action = 'LOGIN'")
    fun findFirstLoginDate(userId: Long): LocalDateTime?

    @Query("SELECT MAX(a.createdAt) FROM AuditLog a WHERE a.user.id = :userId AND a.action = 'PASSWORD_CHANGE'")
    fun findLastPasswordChangeDate(userId: Long): LocalDateTime?

    @Query("SELECT a.action, COUNT(a) FROM AuditLog a WHERE a.user.id = :userId GROUP BY a.action ORDER BY COUNT(a) DESC")
    fun countActionsByUserId(userId: Long): List<Array<Any>>

    @Query("SELECT DISTINCT a.module FROM AuditLog a ORDER BY a.module")
    fun findDistinctModules(): List<String>

    @Query("SELECT DISTINCT a.action FROM AuditLog a ORDER BY a.action")
    fun findDistinctActions(): List<String>

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.createdAt >= :since")
    fun countSince(since: LocalDateTime): Long

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = :action AND a.createdAt >= :since")
    fun countByActionSince(action: String, since: LocalDateTime): Long

    @Query("SELECT COUNT(DISTINCT a.user.id) FROM AuditLog a WHERE a.createdAt >= :since")
    fun countDistinctUsersSince(since: LocalDateTime): Long

    @Query("SELECT a.details, COUNT(a) FROM AuditLog a WHERE a.action = 'PAGE_VIEW' AND a.createdAt >= :since GROUP BY a.details ORDER BY COUNT(a) DESC")
    fun findTopPagesSince(since: LocalDateTime, pageable: Pageable): List<Array<Any>>

    @Query("SELECT a.user.id, CONCAT(a.user.prenom, ' ', a.user.nom), COUNT(a) FROM AuditLog a WHERE a.user IS NOT NULL AND a.createdAt >= :since GROUP BY a.user.id, a.user.prenom, a.user.nom ORDER BY COUNT(a) DESC")
    fun findTopUsersSince(since: LocalDateTime, pageable: Pageable): List<Array<Any>>

    @Query("SELECT DISTINCT a.user.id, CONCAT(a.user.prenom, ' ', a.user.nom), MAX(a.createdAt) FROM AuditLog a WHERE a.action = 'LOGIN' AND a.createdAt >= :since AND a.user IS NOT NULL GROUP BY a.user.id, a.user.prenom, a.user.nom ORDER BY MAX(a.createdAt) DESC")
    fun findRecentOnlineUsersSince(since: LocalDateTime, pageable: Pageable): List<Array<Any>>

    @Query("SELECT a.action, COUNT(a) FROM AuditLog a WHERE a.createdAt >= :since GROUP BY a.action ORDER BY COUNT(a) DESC")
    fun countActionBreakdownSince(since: LocalDateTime): List<Array<Any>>

    fun findByUser_IdAndModuleAndActionOrderByCreatedAtDesc(userId: Long, module: String, action: String, pageable: Pageable): Page<AuditLog>

    @Modifying
    @Query("UPDATE AuditLog a SET a.user = null WHERE a.user.id = :userId")
    fun setUserNullForUserId(userId: Long)
}

