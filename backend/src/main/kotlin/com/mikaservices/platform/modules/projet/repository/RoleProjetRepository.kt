package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.modules.projet.entity.RoleProjet
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RoleProjetRepository : JpaRepository<RoleProjet, Long> {
    fun findByActifTrue(): List<RoleProjet>
    fun existsByCode(code: String): Boolean
    fun findFirstByNomIgnoreCaseAndActifTrue(nom: String): RoleProjet?
}
