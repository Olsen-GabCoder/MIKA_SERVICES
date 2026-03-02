package com.mikaservices.platform.modules.communication.repository

import com.mikaservices.platform.modules.communication.entity.MessageSuppression
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface MessageSuppressionRepository : JpaRepository<MessageSuppression, Long> {
    @Query("SELECT ms.message.id FROM MessageSuppression ms WHERE ms.user.id = :userId")
    fun findMessageIdsSuppressedByUser(@Param("userId") userId: Long): List<Long>

    fun existsByUser_IdAndMessage_Id(userId: Long, messageId: Long): Boolean
}
