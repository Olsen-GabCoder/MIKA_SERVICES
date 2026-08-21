package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.PushToken
import org.springframework.data.jpa.repository.JpaRepository

interface PushTokenRepository : JpaRepository<PushToken, Long> {
    fun findByToken(token: String): PushToken?
    fun findByUserIdAndActifTrue(userId: Long): List<PushToken>
    fun findByUserIdIn(userIds: List<Long>): List<PushToken>
}
