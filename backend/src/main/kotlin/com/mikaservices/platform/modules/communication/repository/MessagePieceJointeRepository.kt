package com.mikaservices.platform.modules.communication.repository

import com.mikaservices.platform.modules.communication.entity.MessagePieceJointe
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MessagePieceJointeRepository : JpaRepository<MessagePieceJointe, Long> {
    fun findByMessageIdOrderByIdAsc(messageId: Long): List<MessagePieceJointe>
    fun findByMessageIdInOrderByMessageIdAscIdAsc(messageIds: List<Long>): List<MessagePieceJointe>
}
