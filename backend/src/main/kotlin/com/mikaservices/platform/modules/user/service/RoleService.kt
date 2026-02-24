package com.mikaservices.platform.modules.user.service

import com.mikaservices.platform.common.exception.BadRequestException
import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.user.dto.response.RoleResponse
import com.mikaservices.platform.modules.user.entity.Permission
import com.mikaservices.platform.modules.user.entity.Role
import com.mikaservices.platform.modules.user.mapper.RoleMapper
import com.mikaservices.platform.modules.user.repository.PermissionRepository
import com.mikaservices.platform.modules.user.repository.RoleRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class RoleService(
    private val roleRepository: RoleRepository,
    private val permissionRepository: PermissionRepository
) {
    
    private val logger = LoggerFactory.getLogger(RoleService::class.java)
    
    fun findAll(pageable: Pageable): Page<RoleResponse> {
        return roleRepository.findAll(pageable).map { RoleMapper.toResponse(it) }
    }
    
    fun findById(id: Long): RoleResponse {
        val role = roleRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Rôle introuvable avec l'ID: $id") }
        return RoleMapper.toResponse(role)
    }
    
    fun findByCode(code: String): RoleResponse {
        val role = roleRepository.findByCode(code)
            .orElseThrow { ResourceNotFoundException("Rôle introuvable avec le code: $code") }
        return RoleMapper.toResponse(role)
    }
    
    fun findActiveRoles(): List<RoleResponse> {
        return RoleMapper.toResponseList(roleRepository.findByActifTrue())
    }
    
    fun addPermissionToRole(roleId: Long, permissionId: Long): RoleResponse {
        logger.debug("Ajout de la permission $permissionId au rôle $roleId")
        
        val role = roleRepository.findById(roleId)
            .orElseThrow { ResourceNotFoundException("Rôle introuvable avec l'ID: $roleId") }
        
        val permission = permissionRepository.findById(permissionId)
            .orElseThrow { ResourceNotFoundException("Permission introuvable avec l'ID: $permissionId") }
        
        if (role.permissions.contains(permission)) {
            throw ConflictException("La permission est déjà associée à ce rôle")
        }
        
        role.permissions.add(permission)
        val savedRole = roleRepository.save(role)
        
        logger.info("Permission ajoutée au rôle: ${savedRole.code}")
        return RoleMapper.toResponse(savedRole)
    }
    
    fun removePermissionFromRole(roleId: Long, permissionId: Long): RoleResponse {
        logger.debug("Retrait de la permission $permissionId du rôle $roleId")
        
        val role = roleRepository.findById(roleId)
            .orElseThrow { ResourceNotFoundException("Rôle introuvable avec l'ID: $roleId") }
        
        val permission = permissionRepository.findById(permissionId)
            .orElseThrow { ResourceNotFoundException("Permission introuvable avec l'ID: $permissionId") }
        
        if (!role.permissions.contains(permission)) {
            throw BadRequestException("La permission n'est pas associée à ce rôle")
        }
        
        role.permissions.remove(permission)
        val savedRole = roleRepository.save(role)
        
        logger.info("Permission retirée du rôle: ${savedRole.code}")
        return RoleMapper.toResponse(savedRole)
    }
}
