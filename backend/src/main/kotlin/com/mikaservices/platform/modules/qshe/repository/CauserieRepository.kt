package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.Causerie
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface CauserieRepository : JpaRepository<Causerie, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Causerie>
    fun findByReference(reference: String): Causerie?
    fun countByProjetId(projetId: Long): Long

    @Query("SELECT COUNT(c) FROM Causerie c WHERE c.projet.id = :pid AND c.dateCauserie BETWEEN :debut AND :fin")
    fun countByProjetIdAndPeriode(@Param("pid") projetId: Long, @Param("debut") debut: LocalDate, @Param("fin") fin: LocalDate): Long
}
