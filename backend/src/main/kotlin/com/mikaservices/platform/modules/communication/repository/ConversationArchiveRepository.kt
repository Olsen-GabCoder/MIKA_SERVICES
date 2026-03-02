package com.mikaservices.platform.modules.communication.repository

import com.mikaservices.platform.modules.communication.entity.ConversationArchive
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface ConversationArchiveRepository : JpaRepository<ConversationArchive, Long> {
    fun findByUser_IdAndPeerUserId(userId: Long, peerUserId: Long): ConversationArchive?
    fun existsByUser_IdAndPeerUserId(userId: Long, peerUserId: Long): Boolean

    @Query("SELECT ca.peerUserId FROM ConversationArchive ca WHERE ca.user.id = :userId")
    fun findPeerUserIdsArchivedByUser(@Param("userId") userId: Long): List<Long>
}
