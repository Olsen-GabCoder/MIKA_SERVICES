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
    
    @Query("SELECT a FROM AuditLog a WHERE a.module = :module ORDER BY a.createdAt DESC")
    fun findByModule(module: String, pageable: Pageable): Page<AuditLog>
    
    @Query("SELECT a FROM AuditLog a WHERE a.action = :action ORDER BY a.createdAt DESC")
    fun findByAction(action: String, pageable: Pageable): Page<AuditLog>
    
    @Query("SELECT a FROM AuditLog a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    fun findByDateRange(startDate: LocalDateTime, endDate: LocalDateTime, pageable: Pageable): Page<AuditLog>
    
    @Query("SELECT a FROM AuditLog a WHERE a.user.id = :userId AND a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    fun findByUserAndDateRange(userId: Long, startDate: LocalDateTime, endDate: LocalDateTime, pageable: Pageable): Page<AuditLog>

    @Modifying
    @Query("UPDATE AuditLog a SET a.user = null WHERE a.user.id = :userId")
    fun setUserNullForUserId(userId: Long)
}

