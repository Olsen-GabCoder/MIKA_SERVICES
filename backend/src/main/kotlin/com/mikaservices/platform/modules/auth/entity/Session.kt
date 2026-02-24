package com.mikaservices.platform.modules.auth.entity

import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "sessions", indexes = [
    Index(name = "idx_token", columnList = "token", unique = true),
    Index(name = "idx_user", columnList = "user_id")
])
class Session(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,
    
    @Column(name = "token", nullable = false, unique = true, length = 500)
    var token: String,
    
    @Column(name = "refresh_token", nullable = false, unique = true, length = 500)
    var refreshToken: String,
    
    @Column(name = "ip_address", length = 50)
    var ipAddress: String? = null,
    
    @Column(name = "user_agent", length = 500)
    var userAgent: String? = null,
    
    @Column(name = "date_debut", nullable = false)
    var dateDebut: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "date_expiration", nullable = false)
    var dateExpiration: LocalDateTime,
    
    @Column(name = "last_activity")
    var lastActivity: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "active", nullable = false)
    var active: Boolean = true
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Session) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0

    override fun toString(): String = "Session(id=$id, active=$active)"
}
