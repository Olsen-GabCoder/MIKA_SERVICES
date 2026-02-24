package com.mikaservices.platform.modules.auth.dto.response

data class Login2FAPendingResponse(
    val requires2FA: Boolean = true,
    val tempToken: String,
    val message: String = "Code 2FA requis"
)
