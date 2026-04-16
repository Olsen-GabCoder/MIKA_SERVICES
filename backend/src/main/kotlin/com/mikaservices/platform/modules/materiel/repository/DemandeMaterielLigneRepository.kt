package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.DemandeMaterielLigne
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DemandeMaterielLigneRepository : JpaRepository<DemandeMaterielLigne, Long> {

    fun findByDemandeIdOrderByIdAsc(demandeId: Long): List<DemandeMaterielLigne>
}
