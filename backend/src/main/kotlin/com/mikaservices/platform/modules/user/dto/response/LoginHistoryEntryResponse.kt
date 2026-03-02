package com.mikaservices.platform.modules.user.dto.response

import java.time.LocalDateTime

/** Une entrée de l'historique des connexions (issue des audit logs AUTH/LOGIN). */
data class LoginHistoryEntryResponse(
    val createdAt: LocalDateTime,
    val ipAddress: String?,
    val deviceSummary: String?
)
