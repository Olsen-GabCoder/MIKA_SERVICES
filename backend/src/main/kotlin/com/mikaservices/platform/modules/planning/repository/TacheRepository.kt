package com.mikaservices.platform.modules.planning.repository

import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutTache
import com.mikaservices.platform.modules.planning.entity.Tache
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface TacheRepository : JpaRepository<Tache, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Tache>
    fun findByAssigneAId(userId: Long): List<Tache>
    fun findByStatut(statut: StatutTache): List<Tache>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutTache): List<Tache>
    fun findByPriorite(priorite: Priorite): List<Tache>

    @Query("SELECT t FROM Tache t WHERE t.assigneA.id = :userId AND t.statut IN ('A_FAIRE', 'EN_COURS', 'EN_ATTENTE')")
    fun findTachesEnCoursParUtilisateur(@Param("userId") userId: Long): List<Tache>

    @Query("SELECT t FROM Tache t WHERE t.dateEcheance <= :date AND t.statut IN ('A_FAIRE', 'EN_COURS')")
    fun findTachesEnRetard(@Param("date") date: LocalDate): List<Tache>

    @Query("SELECT COUNT(t) FROM Tache t WHERE t.projet.id = :projetId AND t.statut = :statut")
    fun countByProjetIdAndStatut(@Param("projetId") projetId: Long, @Param("statut") statut: StatutTache): Long
}
