package com.mikaservices.platform.modules.budget.repository

import com.mikaservices.platform.common.enums.StatutDepense
import com.mikaservices.platform.common.enums.TypeDepense
import com.mikaservices.platform.modules.budget.entity.Depense
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.LocalDate

@Repository
interface DepenseRepository : JpaRepository<Depense, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Depense>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutDepense): List<Depense>
    fun findByType(type: TypeDepense): List<Depense>

    @Query("SELECT COALESCE(SUM(d.montant), 0) FROM Depense d WHERE d.projet.id = :projetId AND d.statut IN ('VALIDEE', 'PAYEE')")
    fun sumMontantByProjetId(@Param("projetId") projetId: Long): BigDecimal

    @Query("SELECT COALESCE(SUM(d.montant), 0) FROM Depense d WHERE d.projet.id = :projetId AND d.type = :type AND d.statut IN ('VALIDEE', 'PAYEE')")
    fun sumMontantByProjetIdAndType(@Param("projetId") projetId: Long, @Param("type") type: TypeDepense): BigDecimal

    @Query("SELECT COALESCE(SUM(d.montant), 0) FROM Depense d WHERE d.projet.id = :projetId AND d.dateDepense BETWEEN :debut AND :fin AND d.statut IN ('VALIDEE', 'PAYEE')")
    fun sumMontantByProjetIdAndPeriode(@Param("projetId") projetId: Long, @Param("debut") debut: LocalDate, @Param("fin") fin: LocalDate): BigDecimal
}
