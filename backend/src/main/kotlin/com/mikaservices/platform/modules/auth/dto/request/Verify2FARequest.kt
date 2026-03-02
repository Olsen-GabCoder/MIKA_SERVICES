package com.mikaservices.platform.modules.auth.dto.request

data class Verify2FARequest(
    val tempToken: String = "",
    val code: String = "",
    val rememberMe: Boolean = false
)
