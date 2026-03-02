package com.mikaservices.platform.modules.reunionhebdo.repository

import com.mikaservices.platform.modules.reunionhebdo.entity.PointProjetPV
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PointProjetPVRepository : JpaRepository<PointProjetPV, Long> {
    fun findByReunionIdOrderByOrdreAffichageAsc(reunionId: Long): List<PointProjetPV>
    fun findByReunionIdAndProjetId(reunionId: Long, projetId: Long): PointProjetPV?
    fun deleteByReunionId(reunionId: Long)

    /** Points PV du projet, des plus récents aux plus anciens (par date de réunion). */
    fun findByProjetIdOrderByReunion_DateReunionDesc(projetId: Long): List<PointProjetPV>
}
