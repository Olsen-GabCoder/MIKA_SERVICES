package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.AffectationMateriauChantier
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AffectationMateriauChantierRepository : JpaRepository<AffectationMateriauChantier, Long> {
    fun findByProjetId(projetId: Long): List<AffectationMateriauChantier>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<AffectationMateriauChantier>
    fun findByMateriauId(materiauId: Long): List<AffectationMateriauChantier>
}
