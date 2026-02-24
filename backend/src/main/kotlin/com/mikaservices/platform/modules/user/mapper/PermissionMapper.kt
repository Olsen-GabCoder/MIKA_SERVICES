package com.mikaservices.platform.modules.user.mapper

import com.mikaservices.platform.modules.user.dto.response.PermissionResponse
import com.mikaservices.platform.modules.user.entity.Permission

object PermissionMapper {
    fun toResponse(permission: Permission): PermissionResponse {
        return PermissionResponse(
            id = permission.id!!,
            code = permission.code,
            nom = permission.nom,
            module = permission.module,
            type = permission.type,
            description = permission.description,
            actif = permission.actif
        )
    }
    
    fun toResponseList(permissions: Collection<Permission>): List<PermissionResponse> {
        return permissions.map { toResponse(it) }
    }
}
