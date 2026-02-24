package com.mikaservices.platform.modules.securite.repository

import com.mikaservices.platform.common.enums.GraviteIncident
import com.mikaservices.platform.common.enums.StatutIncident
import com.mikaservices.platform.modules.securite.entity.Incident
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface IncidentRepository : JpaRepository<Incident, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Incident>
    fun findByStatut(statut: StatutIncident): List<Incident>
    fun findByGravite(gravite: GraviteIncident): List<Incident>
    fun findByReference(reference: String): Incident?

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.projet.id = :projetId")
    fun countByProjetId(@Param("projetId") projetId: Long): Long

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.projet.id = :projetId AND i.gravite IN ('GRAVE', 'TRES_GRAVE', 'MORTEL')")
    fun countGravesParProjet(@Param("projetId") projetId: Long): Long

    @Query("SELECT SUM(i.nbJoursArret) FROM Incident i WHERE i.projet.id = :projetId")
    fun sumJoursArretParProjet(@Param("projetId") projetId: Long): Long?

    @Query("SELECT i.gravite, COUNT(i) FROM Incident i WHERE i.projet.id = :projetId GROUP BY i.gravite")
    fun countByGraviteForProjet(@Param("projetId") projetId: Long): List<Array<Any>>
}
