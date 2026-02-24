package com.mikaservices.platform.modules.user.mapper

import com.mikaservices.platform.modules.user.dto.response.RoleResponse
import com.mikaservices.platform.modules.user.entity.Role

object RoleMapper {
    fun toResponse(role: Role): RoleResponse {
        return RoleResponse(
            id = role.id!!,
            code = role.code,
            nom = role.nom,
            description = role.description,
            niveau = role.niveau,
            actif = role.actif,
            permissions = PermissionMapper.toResponseList(role.permissions)
        )
    }
    
    fun toResponseList(roles: Collection<Role>): List<RoleResponse> {
        return roles.map { toResponse(it) }
    }
}
