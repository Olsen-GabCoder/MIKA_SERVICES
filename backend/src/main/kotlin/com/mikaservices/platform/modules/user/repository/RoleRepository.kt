package com.mikaservices.platform.modules.user.repository

import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.common.enums.NiveauHierarchique
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface RoleRepository : JpaRepository<Role, Long> {
    fun findByCode(code: String): Optional<Role>

    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r.code = :code")
    fun findByCodeWithPermissions(code: String): Optional<Role>

    fun findByActifTrue(): List<Role>
    fun findByNiveauAndActifTrue(niveau: NiveauHierarchique): List<Role>
    fun existsByCode(code: String): Boolean
    
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.id = :permissionId AND r.actif = true")
    fun findByPermissionId(permissionId: Long): List<Role>
}
