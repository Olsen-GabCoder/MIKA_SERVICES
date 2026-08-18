package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.PlanMaintenance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface PlanMaintenanceRepository : JpaRepository<PlanMaintenance, Long> {
    fun findByEnginIdAndActifTrue(enginId: Long): List<PlanMaintenance>
    fun findByEnginId(enginId: Long): List<PlanMaintenance>
    fun findByActifTrue(): List<PlanMaintenance>

    /** Plans dont l'échéance date est dépassée ou dans le seuil d'alerte. */
    @Query("""
        SELECT p FROM PlanMaintenance p
        WHERE p.actif = true
        AND p.prochaineEcheance IS NOT NULL
        AND p.prochaineEcheance <= :dateAlerte
    """)
    fun findPlansEcheanceDateProche(@Param("dateAlerte") dateAlerte: LocalDate): List<PlanMaintenance>

    /** Plans dont le compteur est dépassé ou dans le seuil d'alerte. */
    @Query("""
        SELECT p FROM PlanMaintenance p JOIN p.engin e
        WHERE p.actif = true
        AND p.prochainCompteur IS NOT NULL
        AND e.heuresCompteur >= (p.prochainCompteur - p.seuilAlerte)
    """)
    fun findPlansEcheanceCompteurProche(): List<PlanMaintenance>
}
