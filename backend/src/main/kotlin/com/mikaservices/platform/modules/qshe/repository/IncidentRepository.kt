package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.enums.GraviteIncident
import com.mikaservices.platform.modules.qshe.enums.StatutIncident
import com.mikaservices.platform.modules.qshe.enums.TypeIncident
import com.mikaservices.platform.modules.qshe.entity.Incident
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface IncidentRepository : JpaRepository<Incident, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Incident>

    fun findByProjetIdAndStatut(projetId: Long, statut: StatutIncident): List<Incident>

    fun findByProjetIdAndTypeIncident(projetId: Long, typeIncident: TypeIncident): List<Incident>

    fun findByReference(reference: String): Incident?

    fun countByProjetId(projetId: Long): Long

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.projet.id = :projetId AND i.gravite IN :gravites")
    fun countByProjetIdAndGraviteIn(@Param("projetId") projetId: Long, @Param("gravites") gravites: List<GraviteIncident>): Long

    @Query("SELECT COALESCE(SUM(v.nbJoursArret), 0) FROM VictimeIncident v WHERE v.incident.projet.id = :projetId")
    fun sumJoursArretByProjetId(@Param("projetId") projetId: Long): Long

    /** Incidents dont la declaration CNSS n'a pas ete effectuee et dont l'echeance est depassee */
    @Query("SELECT i FROM Incident i WHERE i.declarationCnssEffectuee = false AND i.dateEcheanceCnss IS NOT NULL AND i.dateEcheanceCnss < :today AND i.statut <> 'CLOTURE'")
    fun findDeclarationCnssEnRetard(@Param("today") today: LocalDate): List<Incident>

    /** Incidents dont la declaration Inspection du Travail n'a pas ete effectuee et dont l'echeance est depassee */
    @Query("SELECT i FROM Incident i WHERE i.declarationInspectionEffectuee = false AND i.dateEcheanceInspectionTravail IS NOT NULL AND i.dateEcheanceInspectionTravail < :today AND i.statut <> 'CLOTURE'")
    fun findDeclarationInspectionEnRetard(@Param("today") today: LocalDate): List<Incident>
}
