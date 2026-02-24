package com.mikaservices.platform.modules.chantier.repository

import com.mikaservices.platform.modules.chantier.entity.MembreEquipe
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MembreEquipeRepository : JpaRepository<MembreEquipe, Long> {
    fun findByEquipeIdAndActifTrue(equipeId: Long): List<MembreEquipe>
    fun findByUserIdAndActifTrue(userId: Long): List<MembreEquipe>
    fun existsByEquipeIdAndUserIdAndActifTrue(equipeId: Long, userId: Long): Boolean
}
