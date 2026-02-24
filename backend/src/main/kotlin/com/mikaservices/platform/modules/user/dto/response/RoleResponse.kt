package com.mikaservices.platform.modules.user.dto.response

import com.mikaservices.platform.common.enums.NiveauHierarchique

data class RoleResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val description: String?,
    val niveau: NiveauHierarchique,
    val actif: Boolean,
    val permissions: List<PermissionResponse>
)
