package com.mikaservices.platform.modules.communication.entity

import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "conversation_archives", indexes = [
    Index(name = "idx_archive_user_peer", columnList = "user_id, peer_user_id", unique = true)
])
class ConversationArchive(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(name = "peer_user_id", nullable = false)
    var peerUserId: Long,

    @Column(name = "archived_at", nullable = false)
    var archivedAt: LocalDateTime = LocalDateTime.now()
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
