package com.mikaservices.platform.modules.communication.repository

import com.mikaservices.platform.modules.communication.entity.MessageMention
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MessageMentionRepository : JpaRepository<MessageMention, Long> {
    fun findByMessageId(messageId: Long): List<MessageMention>
    fun findByMessageIdIn(messageIds: List<Long>): List<MessageMention>
}
