package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.common.enums.StatutMaintenance
import com.mikaservices.platform.modules.materiel.entity.OperationMaintenance
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface OperationMaintenanceRepository : JpaRepository<OperationMaintenance, Long> {
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<OperationMaintenance>
    fun findByEnginId(enginId: Long): List<OperationMaintenance>
    fun findByEnginIdAndStatut(enginId: Long, statut: StatutMaintenance): List<OperationMaintenance>
    fun countByEnginIdAndStatut(enginId: Long, statut: StatutMaintenance): Long

    /** Maintenances planifiees dont l'echeance est depassee */
    @Query("SELECT m FROM OperationMaintenance m JOIN FETCH m.engin e WHERE m.statut = 'PLANIFIEE' AND m.echeanceDate IS NOT NULL AND m.echeanceDate < :today AND e.actif = true ORDER BY m.echeanceDate ASC")
    fun findMaintenancesEnRetard(today: LocalDate): List<OperationMaintenance>

    /** Maintenances planifiees a venir dans les N prochains jours */
    @Query("SELECT m FROM OperationMaintenance m JOIN FETCH m.engin e WHERE m.statut = 'PLANIFIEE' AND m.echeanceDate IS NOT NULL AND m.echeanceDate >= :today AND m.echeanceDate <= :limite AND e.actif = true ORDER BY m.echeanceDate ASC")
    fun findMaintenancesAVenir(today: LocalDate, limite: LocalDate): List<OperationMaintenance>
}
