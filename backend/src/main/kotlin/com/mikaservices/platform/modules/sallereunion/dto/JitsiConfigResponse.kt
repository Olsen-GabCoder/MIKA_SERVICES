package com.mikaservices.platform.modules.sallereunion.dto

data class JitsiConfigResponse(
    val roomName: String,
    val displayName: String,
    val subject: String,
    val ouverte: Boolean
)
