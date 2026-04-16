package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielHistorique
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DemandeMaterielHistoriqueRepository : JpaRepository<DemandeMaterielHistorique, Long> {

    fun findByDemandeIdOrderByDateTransitionAsc(demandeId: Long): List<DemandeMaterielHistorique>
}
