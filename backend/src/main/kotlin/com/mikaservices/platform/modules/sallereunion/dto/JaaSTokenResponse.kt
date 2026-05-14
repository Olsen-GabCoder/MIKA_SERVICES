package com.mikaservices.platform.modules.sallereunion.dto

data class JaaSTokenResponse(
    val token: String,
    val appId: String,
    val roomName: String,
    val displayName: String,
    val subject: String,
    val moderator: Boolean
)
