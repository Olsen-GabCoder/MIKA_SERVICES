package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.common.enums.TypeMateriau
import com.mikaservices.platform.modules.materiel.entity.Materiau
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface MateriauRepository : JpaRepository<Materiau, Long> {
    fun findByCode(code: String): Optional<Materiau>
    fun existsByCode(code: String): Boolean
    fun findByActifTrue(pageable: Pageable): Page<Materiau>
    fun findByType(type: TypeMateriau): List<Materiau>

    @Query("SELECT m FROM Materiau m WHERE m.actif = true AND m.stockActuel <= m.stockMinimum")
    fun findStockBas(): List<Materiau>

    @Query("SELECT m FROM Materiau m WHERE m.actif = true AND " +
           "(LOWER(m.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    fun search(@Param("search") search: String, pageable: Pageable): Page<Materiau>
}
