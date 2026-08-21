package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(
    name = "push_tokens",
    uniqueConstraints = [UniqueConstraint(columnNames = ["token"])]
)
class PushToken(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(nullable = false, length = 512)
    var token: String,

    @Column(name = "device_info", length = 200)
    var deviceInfo: String? = null,

    @Column(length = 20)
    var platform: String? = null,

    var actif: Boolean = true,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "last_used_at")
    var lastUsedAt: Instant = Instant.now(),

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
)
