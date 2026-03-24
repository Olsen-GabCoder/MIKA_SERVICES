package com.mikaservices.platform.modules.user.repository

import com.mikaservices.platform.modules.user.entity.User
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface UserRepository : JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    /** Rôles chargés : évite LazyInitializationException hors @Transactional (ex. ProjetController). */
    @EntityGraph(attributePaths = ["roles"])
    fun findByEmail(email: String): Optional<User>
    fun findByMatricule(matricule: String): Optional<User>
    fun findByActifTrue(): List<User>
    fun existsByEmail(email: String): Boolean
    fun existsByMatricule(matricule: String): Boolean
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.code = :roleCode AND u.actif = true")
    fun findByRoleCode(roleCode: String): List<User>
    
    @Query("SELECT u FROM User u JOIN u.departements d WHERE d.id = :departementId AND u.actif = true")
    fun findByDepartementId(departementId: Long): List<User>
    
    @Query("SELECT u FROM User u WHERE u.superieurHierarchique.id = :superieurId AND u.actif = true")
    fun findBySuperieurHierarchiqueId(superieurId: Long): List<User>

    @Query("SELECT u FROM User u WHERE u.superieurHierarchique.id = :superieurId")
    fun findAllBySuperieurHierarchiqueId(superieurId: Long): List<User>

    @Query("SELECT MAX(u.matricule) FROM User u WHERE u.matricule LIKE :prefix")
    fun findMaxMatriculeByPrefix(prefix: String): String?
}
