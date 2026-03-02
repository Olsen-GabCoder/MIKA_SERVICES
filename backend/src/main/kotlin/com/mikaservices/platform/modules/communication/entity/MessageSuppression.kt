package com.mikaservices.platform.modules.communication.entity

import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

/** Suppression "pour moi" : l'utilisateur masque un message de sa vue (inbox/sent). */
@Entity
@Table(name = "message_suppressions", indexes = [
    Index(name = "idx_suppression_user_message", columnList = "user_id, message_id", unique = true)
])
class MessageSuppression(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    var message: Message,

    @Column(name = "suppressed_at", nullable = false)
    var suppressedAt: LocalDateTime = LocalDateTime.now()
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
