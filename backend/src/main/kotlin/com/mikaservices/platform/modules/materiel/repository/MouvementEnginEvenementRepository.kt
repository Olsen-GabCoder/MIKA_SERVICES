package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.MouvementEnginEvenement
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MouvementEnginEvenementRepository : JpaRepository<MouvementEnginEvenement, Long> {

    fun findByMouvementIdOrderByOccurredAtAsc(mouvementId: Long): List<MouvementEnginEvenement>
}
