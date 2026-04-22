package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.ActionCorrective
import com.mikaservices.platform.modules.qshe.enums.SourceAction
import com.mikaservices.platform.modules.qshe.enums.StatutAction
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface ActionCorrectiveRepository : JpaRepository<ActionCorrective, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<ActionCorrective>

    fun findBySourceTypeAndSourceId(sourceType: SourceAction, sourceId: Long): List<ActionCorrective>

    fun findByResponsableId(userId: Long, pageable: Pageable): Page<ActionCorrective>

    fun findByStatut(statut: StatutAction): List<ActionCorrective>

    fun findByReference(reference: String): ActionCorrective?

    fun countByProjetId(projetId: Long): Long

    @Query("SELECT COUNT(a) FROM ActionCorrective a WHERE a.projet.id = :projetId AND a.statut IN :statuts")
    fun countByProjetIdAndStatutIn(@Param("projetId") projetId: Long, @Param("statuts") statuts: List<StatutAction>): Long

    /** Actions en retard : echeance depassee et statut PLANIFIEE ou EN_COURS */
    @Query("SELECT a FROM ActionCorrective a WHERE a.dateEcheance < :today AND a.statut IN ('PLANIFIEE', 'EN_COURS')")
    fun findEnRetard(@Param("today") today: LocalDate): List<ActionCorrective>

    @Query("SELECT a FROM ActionCorrective a WHERE a.projet.id = :projetId AND a.dateEcheance < :today AND a.statut IN ('PLANIFIEE', 'EN_COURS')")
    fun findEnRetardByProjet(@Param("projetId") projetId: Long, @Param("today") today: LocalDate): List<ActionCorrective>

    @Query("SELECT COUNT(a) FROM ActionCorrective a WHERE a.projet.id = :projetId AND a.dateEcheance < :today AND a.statut IN ('PLANIFIEE', 'EN_COURS')")
    fun countEnRetardByProjet(@Param("projetId") projetId: Long, @Param("today") today: LocalDate): Long
}
