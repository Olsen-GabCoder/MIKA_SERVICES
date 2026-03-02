package com.mikaservices.platform.modules.communication.entity

import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*

@Entity
@Table(name = "message_mentions", indexes = [
    Index(name = "idx_mention_message", columnList = "message_id"),
    Index(name = "idx_mention_user", columnList = "user_id")
])
class MessageMention(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    var message: Message,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
