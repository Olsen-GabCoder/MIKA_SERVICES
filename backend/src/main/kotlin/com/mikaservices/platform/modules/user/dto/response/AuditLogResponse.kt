package com.mikaservices.platform.modules.user.dto.response

import java.time.LocalDateTime

data class AuditLogResponse(
    val id: Long,
    val userId: Long?,
    val action: String,
    val module: String,
    val details: String?,
    val ipAddress: String?,
    val createdAt: LocalDateTime
)
