package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.TypePrevision
import com.mikaservices.platform.modules.projet.entity.Prevision
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PrevisionRepository : JpaRepository<Prevision, Long> {
    fun findByProjetId(projetId: Long): List<Prevision>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Prevision>
    fun findByProjetIdAndAnnee(projetId: Long, annee: Int): List<Prevision>
    fun findByProjetIdAndSemaineAndAnnee(projetId: Long, semaine: Int, annee: Int): List<Prevision>
    fun findByType(type: TypePrevision): List<Prevision>

    fun findBySemaineAndAnnee(semaine: Int, annee: Int): List<Prevision>
    fun findByAnnee(annee: Int): List<Prevision>

    @org.springframework.data.jpa.repository.Query(
        "SELECT p FROM Prevision p WHERE " +
        "(p.annee > :startYear OR (p.annee = :startYear AND p.semaine >= :startWeek)) " +
        "AND (p.annee < :endYear OR (p.annee = :endYear AND p.semaine <= :endWeek))"
    )
    fun findByWeekRange(startYear: Int, startWeek: Int, endYear: Int, endWeek: Int): List<Prevision>
}
