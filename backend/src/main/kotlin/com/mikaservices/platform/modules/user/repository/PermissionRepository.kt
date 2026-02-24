package com.mikaservices.platform.modules.user.repository

import com.mikaservices.platform.modules.user.entity.Permission
import com.mikaservices.platform.common.enums.TypePermission
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface PermissionRepository : JpaRepository<Permission, Long> {
    fun findByCode(code: String): Optional<Permission>
    fun findByModuleAndActifTrue(module: String): List<Permission>
    fun findByTypeAndActifTrue(type: TypePermission): List<Permission>
    fun existsByCode(code: String): Boolean
}
