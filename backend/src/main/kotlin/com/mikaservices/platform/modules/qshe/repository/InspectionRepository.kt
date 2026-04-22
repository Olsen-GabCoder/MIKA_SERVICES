package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.Inspection
import com.mikaservices.platform.modules.qshe.enums.StatutInspection
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface InspectionRepository : JpaRepository<Inspection, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Inspection>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutInspection): List<Inspection>
    fun findByReference(reference: String): Inspection?
    fun countByProjetId(projetId: Long): Long

    @Query("SELECT COUNT(i) FROM Inspection i WHERE i.projet.id = :projetId AND i.statut = 'TERMINEE'")
    fun countTermineesByProjet(@Param("projetId") projetId: Long): Long
}
