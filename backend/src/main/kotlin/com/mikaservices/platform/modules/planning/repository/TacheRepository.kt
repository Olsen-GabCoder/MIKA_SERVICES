package com.mikaservices.platform.modules.planning.repository

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.modules.planning.entity.Tache
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface TacheRepository : JpaRepository<Tache, Long> {
    @EntityGraph(attributePaths = ["projet", "assigneA"])
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    fun findByProjetId(projetId: Long): List<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    fun findByAssigneAId(userId: Long): List<Tache>

    fun findByStatut(statut: StatutTache): List<Tache>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutTache): List<Tache>
    fun findByPriorite(priorite: Priorite): List<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    fun findByProjetIdAndSemaineAndAnnee(projetId: Long, semaine: Int, annee: Int): List<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    fun findByProjetIdAndAnnee(projetId: Long, annee: Int): List<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    @Query("SELECT t FROM Tache t WHERE t.assigneA.id = :userId AND t.statut IN :statuts")
    fun findTachesEnCoursParUtilisateur(
        @Param("userId") userId: Long,
        @Param("statuts") statuts: List<StatutTache>
    ): List<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    @Query("SELECT t FROM Tache t WHERE t.dateEcheance <= :date AND t.statut IN :statuts")
    fun findTachesEnRetard(
        @Param("date") date: LocalDate,
        @Param("statuts") statuts: List<StatutTache>
    ): List<Tache>

    @Query("SELECT COUNT(t) FROM Tache t WHERE t.projet.id = :projetId AND t.statut = :statut")
    fun countByProjetIdAndStatut(@Param("projetId") projetId: Long, @Param("statut") statut: StatutTache): Long

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    @Query("SELECT t FROM Tache t WHERE t.typePrevision IS NOT NULL AND t.projet.id = :projetId")
    fun findPrevisionsByProjetId(@Param("projetId") projetId: Long): List<Tache>

    @EntityGraph(attributePaths = ["projet", "assigneA"])
    @Query("""
        SELECT t FROM Tache t WHERE t.typePrevision IS NOT NULL
        AND t.semaine BETWEEN :semaineDebut AND :semaineFin
        AND t.annee = :annee
    """)
    fun findPrevisionsByWeekRange(
        @Param("semaineDebut") semaineDebut: Int,
        @Param("semaineFin") semaineFin: Int,
        @Param("annee") annee: Int
    ): List<Tache>

    @Query("""
        SELECT t.projet.id,
               t.projet.nom,
               t.projet.ville,
               COUNT(t),
               SUM(CASE WHEN t.statut = 'A_FAIRE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN t.statut = 'EN_COURS' THEN 1 ELSE 0 END),
               SUM(CASE WHEN t.statut = 'EN_ATTENTE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN t.statut = 'TERMINEE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN t.statut = 'ANNULEE' THEN 1 ELSE 0 END),
               SUM(CASE WHEN t.dateEcheance <= CURRENT_DATE AND t.statut IN ('A_FAIRE', 'EN_COURS') THEN 1 ELSE 0 END),
               COALESCE(AVG(t.pourcentageAvancement), 0)
        FROM Tache t
        WHERE t.projet.id IN :projetIds
        GROUP BY t.projet.id, t.projet.nom, t.projet.ville
    """)
    fun getStatsByProjetIds(@Param("projetIds") projetIds: List<Long>): List<Array<Any>>
}
