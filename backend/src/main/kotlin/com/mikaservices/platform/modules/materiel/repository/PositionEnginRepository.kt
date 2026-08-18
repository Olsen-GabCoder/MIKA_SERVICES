package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.PositionEngin
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface PositionEnginRepository : JpaRepository<PositionEngin, Long> {
    fun findByEnginIdOrderByHorodatageDesc(enginId: Long, pageable: Pageable): Page<PositionEngin>

    /** Derniere position connue de chaque engin (pour la carte temps reel) */
    @Query(
        """
        SELECT p FROM PositionEngin p
        WHERE p.engin.id IN :enginIds
          AND p.horodatage = (SELECT MAX(p2.horodatage) FROM PositionEngin p2 WHERE p2.engin.id = p.engin.id)
        """
    )
    fun findLatestByEnginIds(enginIds: List<Long>): List<PositionEngin>
}
