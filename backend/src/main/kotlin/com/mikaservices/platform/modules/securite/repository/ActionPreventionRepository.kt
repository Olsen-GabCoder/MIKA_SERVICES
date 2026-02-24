package com.mikaservices.platform.modules.securite.repository

import com.mikaservices.platform.common.enums.StatutActionPrevention
import com.mikaservices.platform.modules.securite.entity.ActionPrevention
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface ActionPreventionRepository : JpaRepository<ActionPrevention, Long> {
    fun findByIncidentId(incidentId: Long): List<ActionPrevention>
    fun findByStatut(statut: StatutActionPrevention): List<ActionPrevention>
    fun findByResponsableId(userId: Long): List<ActionPrevention>

    @Query("SELECT ap FROM ActionPrevention ap WHERE ap.statut NOT IN ('REALISEE', 'VERIFIEE', 'ANNULEE') AND ap.dateEcheance <= :date")
    fun findEnRetard(@Param("date") date: LocalDate): List<ActionPrevention>
}
