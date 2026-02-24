package com.mikaservices.platform.modules.chantier.repository

import com.mikaservices.platform.common.enums.TypeEquipe
import com.mikaservices.platform.modules.chantier.entity.Equipe
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface EquipeRepository : JpaRepository<Equipe, Long> {
    fun findByCode(code: String): Optional<Equipe>
    fun existsByCode(code: String): Boolean
    fun findByActifTrue(pageable: Pageable): Page<Equipe>
    fun findByActifTrue(): List<Equipe>
    fun findByType(type: TypeEquipe): List<Equipe>
    fun findByChefEquipeId(userId: Long): List<Equipe>
}
