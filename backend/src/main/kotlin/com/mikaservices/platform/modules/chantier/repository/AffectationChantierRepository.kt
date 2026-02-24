package com.mikaservices.platform.modules.chantier.repository

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.chantier.entity.AffectationChantier
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AffectationChantierRepository : JpaRepository<AffectationChantier, Long> {
    fun findByProjetId(projetId: Long): List<AffectationChantier>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<AffectationChantier>
    fun findByEquipeId(equipeId: Long): List<AffectationChantier>
    fun findByStatut(statut: StatutAffectation): List<AffectationChantier>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutAffectation): List<AffectationChantier>
}
