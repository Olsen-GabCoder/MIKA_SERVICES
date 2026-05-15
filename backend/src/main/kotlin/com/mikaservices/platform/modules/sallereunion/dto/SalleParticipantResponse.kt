package com.mikaservices.platform.modules.sallereunion.dto

import java.time.LocalDateTime

data class SalleParticipantResponse(
    val id: Long,
    val user: UserSummary,
    val joinedAt: LocalDateTime,
    val leftAt: LocalDateTime?,
)
