package com.mikaservices.platform.modules.user.service

import com.mikaservices.platform.modules.user.dto.response.AuditLogResponse
import com.mikaservices.platform.modules.user.dto.response.GlobalAuditStats
import com.mikaservices.platform.modules.user.dto.response.RankedItem
import com.mikaservices.platform.modules.user.dto.response.RankedUserItem
import com.mikaservices.platform.modules.user.dto.response.RecentOnlineUser
import com.mikaservices.platform.modules.user.dto.response.UserActivitySummary
import com.mikaservices.platform.modules.user.entity.AuditLog
import com.mikaservices.platform.modules.user.entity.User
import com.mikaservices.platform.modules.user.repository.AuditLogRepository
import com.mikaservices.platform.modules.user.repository.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AuditLogService(
    private val auditLogRepository: AuditLogRepository,
    private val userRepository: UserRepository
) {

    fun log(
        targetUser: User?,
        module: String,
        action: String,
        details: String? = null,
        ipAddress: String? = null,
        actorOverride: String? = null
    ) {
        val actor = actorOverride ?: SecurityContextHolder.getContext().authentication?.name ?: "system"
        val detailsWithActor = details?.let { "$it | Par: $actor" } ?: "Par: $actor"
        val log = AuditLog(
            user = targetUser,
            action = action,
            module = module,
            details = detailsWithActor,
            ipAddress = ipAddress
        )
        auditLogRepository.save(log)
    }

    fun logPageView(userId: Long, page: String, ipAddress: String?) {
        val user: User = userRepository.findById(userId).orElse(null) ?: return
        val log = AuditLog(
            user = user,
            action = "PAGE_VIEW",
            module = "NAVIGATION",
            details = page,
            ipAddress = ipAddress
        )
        auditLogRepository.save(log)
    }

    @Transactional(readOnly = true)
    fun findFiltered(
        userId: Long?,
        module: String?,
        actions: List<String>?,
        startDate: LocalDateTime?,
        endDate: LocalDateTime?,
        pageable: Pageable
    ): Page<AuditLogResponse> {
        val hasNoFilters = userId == null && module == null && actions.isNullOrEmpty() && startDate == null && endDate == null
        val page = when {
            hasNoFilters -> auditLogRepository.findAllDesc(pageable)
            actions.isNullOrEmpty() -> auditLogRepository.findFilteredNoActions(userId, module, startDate, endDate, pageable)
            else -> auditLogRepository.findFilteredWithActions(userId, module, actions, startDate, endDate, pageable)
        }
        return page.map { toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getUserActivitySummary(userId: Long): UserActivitySummary {
        val user: User? = userRepository.findById(userId).orElse(null)
        val firstLogin = auditLogRepository.findFirstLoginDate(userId)
        val lastPasswordChange = auditLogRepository.findLastPasswordChangeDate(userId)
        val totalLogins = auditLogRepository.countByUserIdAndAction(userId, "LOGIN")
        val totalPageViews = auditLogRepository.countByUserIdAndAction(userId, "PAGE_VIEW")
        val actionCounts = auditLogRepository.countActionsByUserId(userId)
            .associate { (it[0] as String) to (it[1] as Long) }

        return UserActivitySummary(
            userId = userId,
            userName = user?.let { "${it.prenom} ${it.nom}" } ?: "—",
            firstLogin = firstLogin,
            lastLogin = user?.lastLogin,
            lastPasswordChange = lastPasswordChange,
            totalLogins = totalLogins,
            totalPageViews = totalPageViews,
            totalActions = actionCounts.values.sum(),
            actionBreakdown = actionCounts
        )
    }

    @Transactional(readOnly = true)
    fun getGlobalStats(): GlobalAuditStats {
        val now = LocalDateTime.now()
        val startOfToday = now.toLocalDate().atStartOfDay()
        val startOfYesterday = startOfToday.minusDays(1)

        val eventsToday = auditLogRepository.countSince(startOfToday)
        val eventsYesterday = auditLogRepository.countSince(startOfYesterday) - eventsToday
        val loginsToday = auditLogRepository.countByActionSince("LOGIN", startOfToday)
        val logoutsToday = auditLogRepository.countByActionSince("LOGOUT", startOfToday)
        val uniqueUsersToday = auditLogRepository.countDistinctUsersSince(startOfToday)
        val pageViewsToday = auditLogRepository.countByActionSince("PAGE_VIEW", startOfToday)

        val securityActions = listOf("PASSWORD_CHANGE", "PASSWORD_RESET", "2FA_ENABLE", "2FA_DISABLE", "ACTIVATE", "DEACTIVATE")
        val securityEventsToday = securityActions.sumOf { auditLogRepository.countByActionSince(it, startOfToday) }

        val actionBreakdown = auditLogRepository.countActionBreakdownSince(startOfToday)
            .associate { (it[0] as String) to (it[1] as Long) }

        val top10 = PageRequest.of(0, 10)
        val topPages = auditLogRepository.findTopPagesSince(startOfToday.minusDays(7), top10)
            .map { RankedItem(label = it[0] as String, count = it[1] as Long) }

        val topUsers = auditLogRepository.findTopUsersSince(startOfToday.minusDays(7), top10)
            .map { RankedUserItem(userId = (it[0] as Number).toLong(), userName = it[1] as String, count = (it[2] as Number).toLong()) }

        val recentOnline = auditLogRepository.findRecentOnlineUsersSince(startOfToday.minusDays(1), PageRequest.of(0, 15))
            .map { RecentOnlineUser(userId = (it[0] as Number).toLong(), userName = it[1] as String, lastSeen = it[2] as LocalDateTime) }

        return GlobalAuditStats(
            eventsToday = eventsToday,
            eventsYesterday = eventsYesterday,
            loginsToday = loginsToday,
            logoutsToday = logoutsToday,
            uniqueUsersToday = uniqueUsersToday,
            pageViewsToday = pageViewsToday,
            securityEventsToday = securityEventsToday,
            actionBreakdown = actionBreakdown,
            topPages = topPages,
            topUsers = topUsers,
            recentOnlineUsers = recentOnline
        )
    }

    /** Retourne le décompte d'actions effectuées par un utilisateur depuis minuit aujourd'hui. */
    @Transactional(readOnly = true)
    fun getTodayActivityForUser(userId: Long): Map<String, Long> {
        val startOfToday = java.time.LocalDate.now().atStartOfDay()
        return auditLogRepository.countActionBreakdownForUserSince(userId, startOfToday)
            .associate { (it[0] as String) to (it[1] as Long) }
    }

    @Transactional(readOnly = true)
    fun getFilterOptions(): Map<String, List<String>> {
        return mapOf(
            "modules" to auditLogRepository.findDistinctModules(),
            "actions" to auditLogRepository.findDistinctActions()
        )
    }

    private fun toResponse(log: AuditLog) = AuditLogResponse(
        id = log.id!!,
        userId = log.user?.id,
        userName = log.user?.let { "${it.prenom} ${it.nom}" },
        action = log.action,
        module = log.module,
        details = log.details,
        ipAddress = log.ipAddress,
        createdAt = log.createdAt
    )
}
