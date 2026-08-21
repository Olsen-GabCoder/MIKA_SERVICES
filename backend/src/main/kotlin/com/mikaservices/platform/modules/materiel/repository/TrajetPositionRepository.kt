package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.TrajetPosition
import org.springframework.data.jpa.repository.JpaRepository

interface TrajetPositionRepository : JpaRepository<TrajetPosition, Long> {
    fun findByMouvementIdOrderByHorodatageAsc(mouvementId: Long): List<TrajetPosition>
    fun findFirstByMouvementIdOrderByHorodatageDesc(mouvementId: Long): TrajetPosition?
}
