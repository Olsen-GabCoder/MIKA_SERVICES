package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.common.enums.StatutEngin
import com.mikaservices.platform.common.enums.TypeEngin
import com.mikaservices.platform.modules.materiel.entity.Engin
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface EnginRepository : JpaRepository<Engin, Long> {
    fun findByCode(code: String): Optional<Engin>
    fun existsByCode(code: String): Boolean
    fun findByActifTrue(pageable: Pageable): Page<Engin>
    fun findByStatut(statut: StatutEngin): List<Engin>
    fun findByType(type: TypeEngin): List<Engin>
    fun findByStatutAndActifTrue(statut: StatutEngin): List<Engin>

    @Query("SELECT e FROM Engin e WHERE e.actif = true AND " +
           "(LOWER(e.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.immatriculation) LIKE LOWER(CONCAT('%', :search, '%')))")
    fun search(@Param("search") search: String, pageable: Pageable): Page<Engin>

    @Query("SELECT e FROM Engin e WHERE e.actif = true " +
           "AND (:statut IS NULL OR e.statut = :statut) " +
           "AND (:type IS NULL OR e.type = :type)")
    fun findByFilters(
        @Param("statut") statut: StatutEngin?,
        @Param("type") type: TypeEngin?,
        pageable: Pageable
    ): Page<Engin>
}
