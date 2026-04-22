package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.PermisTravail
import com.mikaservices.platform.modules.qshe.enums.StatutPermis
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface PermisTravailRepository : JpaRepository<PermisTravail, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<PermisTravail>
    fun findByReference(reference: String): PermisTravail?
    fun countByProjetId(projetId: Long): Long
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutPermis): List<PermisTravail>

    @Query("SELECT COUNT(p) FROM PermisTravail p WHERE p.projet.id = :pid AND p.statut = 'ACTIF'")
    fun countActifsByProjet(@Param("pid") projetId: Long): Long

    @Query("SELECT p FROM PermisTravail p WHERE p.statut IN ('ACTIF', 'APPROUVE') AND p.dateFinValidite IS NOT NULL AND p.dateFinValidite < :today")
    fun findExpires(@Param("today") today: LocalDate): List<PermisTravail>
}
