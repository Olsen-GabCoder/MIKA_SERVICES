package com.mikaservices.platform.modules.auth.entity

import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "password_reset_tokens", indexes = [
    Index(name = "idx_password_reset_token", columnList = "token", unique = true),
    Index(name = "idx_password_reset_user", columnList = "user_id")
])
class PasswordResetToken(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(name = "token", nullable = false, unique = true, length = 100)
    var token: String,

    @Column(name = "date_expiration", nullable = false)
    var dateExpiration: LocalDateTime,

    @Column(name = "used", nullable = false)
    var used: Boolean = false
) {
    fun isExpired(): Boolean = LocalDateTime.now().isAfter(dateExpiration)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PasswordResetToken) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
