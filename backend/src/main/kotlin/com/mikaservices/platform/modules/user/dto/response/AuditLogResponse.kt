package com.mikaservices.platform.modules.user.dto.response

import java.time.LocalDateTime

data class AuditLogResponse(
    val id: Long,
    val userId: Long?,
    val userName: String?,
    val action: String,
    val module: String,
    val details: String?,
    val ipAddress: String?,
    val createdAt: LocalDateTime
)

data class UserActivitySummary(
    val userId: Long,
    val userName: String,
    val firstLogin: LocalDateTime?,
    val lastLogin: LocalDateTime?,
    val lastPasswordChange: LocalDateTime?,
    val totalLogins: Long,
    val totalPageViews: Long,
    val totalActions: Long,
    val actionBreakdown: Map<String, Long>
)

data class GlobalAuditStats(
    val eventsToday: Long,
    val eventsYesterday: Long,
    val loginsToday: Long,
    val logoutsToday: Long,
    val uniqueUsersToday: Long,
    val pageViewsToday: Long,
    val securityEventsToday: Long,
    val actionBreakdown: Map<String, Long>,
    val topPages: List<RankedItem>,
    val topUsers: List<RankedUserItem>,
    val recentOnlineUsers: List<RecentOnlineUser>
)

data class RankedItem(val label: String, val count: Long)
data class RankedUserItem(val userId: Long, val userName: String, val count: Long)
data class RecentOnlineUser(val userId: Long, val userName: String, val lastSeen: LocalDateTime)
