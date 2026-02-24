package com.mikaservices.platform.modules.auth.dto.response

import java.time.LocalDateTime

data class SessionResponse(
    val id: Long,
    val ipAddress: String?,
    val userAgent: String?,
    val dateDebut: LocalDateTime,
    val lastActivity: LocalDateTime?
)
