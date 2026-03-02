package com.mikaservices.platform.modules.auth.dto.request

data class Verify2FASetupRequest(
    val code: String = ""
)
