package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.modules.projet.entity.PointBloquant
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PointBloquantRepository : JpaRepository<PointBloquant, Long> {
    fun findByProjetId(projetId: Long): List<PointBloquant>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<PointBloquant>
    fun findByStatut(statut: StatutPointBloquant): List<PointBloquant>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutPointBloquant): List<PointBloquant>
    fun findByPriorite(priorite: Priorite): List<PointBloquant>
    fun findByAssigneAId(userId: Long): List<PointBloquant>
    fun countByProjetIdAndStatut(projetId: Long, statut: StatutPointBloquant): Long

    /** Charge en une seule requête tous les points bloquants actifs (statuts donnés) avec leur projet. */
    @EntityGraph(attributePaths = ["projet"])
    fun findByStatutIn(statuts: Collection<StatutPointBloquant>): List<PointBloquant>
}
