package com.mikaservices.platform.modules.user.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "audit_logs", indexes = [
    Index(name = "idx_user", columnList = "user_id"),
    Index(name = "idx_module", columnList = "module"),
    Index(name = "idx_created_at", columnList = "created_at")
])
class AuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    var user: User? = null,
    
    @Column(name = "action", nullable = false, length = 100)
    var action: String,
    
    @Column(name = "module", nullable = false, length = 50)
    var module: String,
    
    @Column(name = "details", columnDefinition = "TEXT")
    var details: String? = null,
    
    @Column(name = "ip_address", length = 50)
    var ipAddress: String? = null,
    
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AuditLog) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0

    override fun toString(): String = "AuditLog(id=$id, action='$action', module='$module')"
}
