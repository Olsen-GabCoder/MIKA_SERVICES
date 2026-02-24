package com.mikaservices.platform.modules.auth.dto.response

sealed class LoginResult {
    data class Success(val response: AuthResponse) : LoginResult()
    data class Requires2FA(val pending: Login2FAPendingResponse) : LoginResult()
}
