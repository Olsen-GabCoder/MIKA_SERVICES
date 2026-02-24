package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AffectationEnginChantierRepository : JpaRepository<AffectationEnginChantier, Long> {
    fun findByProjetId(projetId: Long): List<AffectationEnginChantier>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<AffectationEnginChantier>
    fun findByEnginId(enginId: Long): List<AffectationEnginChantier>
    fun findByEnginIdAndStatut(enginId: Long, statut: StatutAffectation): List<AffectationEnginChantier>
}
