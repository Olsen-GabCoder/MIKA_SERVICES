package com.mikaservices.platform.modules.user.dto.response

import com.mikaservices.platform.common.enums.TypePermission

data class PermissionResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val module: String,
    val type: TypePermission,
    val description: String?,
    val actif: Boolean
)
