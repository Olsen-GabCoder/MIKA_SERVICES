package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.Epi
import com.mikaservices.platform.modules.qshe.enums.EtatEpi
import com.mikaservices.platform.modules.qshe.enums.TypeEpi
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface EpiRepository : JpaRepository<Epi, Long> {
    fun findByTypeEpi(type: TypeEpi, pageable: Pageable): Page<Epi>
    fun findByAffecteAId(userId: Long): List<Epi>
    fun findByCode(code: String): Epi?
    fun findByEtat(etat: EtatEpi): List<Epi>

    @Query("SELECT e FROM Epi e WHERE e.dateExpiration IS NOT NULL AND e.dateExpiration < :today AND e.etat NOT IN ('RETIRE')")
    fun findExpires(@Param("today") today: LocalDate): List<Epi>

    @Query("SELECT e FROM Epi e WHERE e.quantiteStock <= e.stockMinimum AND e.etat NOT IN ('RETIRE')")
    fun findStockBas(): List<Epi>

    @Query("SELECT COUNT(e) FROM Epi e WHERE e.dateExpiration IS NOT NULL AND e.dateExpiration < :today AND e.etat NOT IN ('RETIRE')")
    fun countExpires(@Param("today") today: LocalDate): Long
}
