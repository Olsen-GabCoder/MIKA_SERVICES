package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.ConsommationCarburant
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.math.BigDecimal
import java.time.LocalDate

interface ConsommationCarburantRepository : JpaRepository<ConsommationCarburant, Long> {
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<ConsommationCarburant>
    fun findByEnginIdOrderByDatePleinDesc(enginId: Long): List<ConsommationCarburant>

    @Query("SELECT COALESCE(SUM(c.quantiteLitres), 0) FROM ConsommationCarburant c WHERE c.engin.id = :enginId AND c.datePlein >= :depuis")
    fun sumLitresByEnginIdSince(enginId: Long, depuis: LocalDate): BigDecimal
}
