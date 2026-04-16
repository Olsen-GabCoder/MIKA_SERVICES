package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.modules.materiel.entity.MouvementEngin
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface MouvementEnginRepository : JpaRepository<MouvementEngin, Long>, JpaSpecificationExecutor<MouvementEngin> {

    fun findByEnginIdAndStatutIn(enginId: Long, statuts: Collection<StatutMouvementEngin>): List<MouvementEngin>

    fun findByEnginIdOrderByDateDemandeDesc(enginId: Long): List<MouvementEngin>
}
