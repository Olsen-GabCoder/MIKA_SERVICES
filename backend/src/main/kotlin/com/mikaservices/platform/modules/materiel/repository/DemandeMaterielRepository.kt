package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.DemandeMateriel
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface DemandeMaterielRepository : JpaRepository<DemandeMateriel, Long>, JpaSpecificationExecutor<DemandeMateriel> {

    @EntityGraph(attributePaths = ["projet", "createur", "commande"])
    @Query("SELECT d FROM DemandeMateriel d WHERE d.id = :id")
    fun fetchWithBasicsById(@Param("id") id: Long): Optional<DemandeMateriel>

    fun findByReference(reference: String): Optional<DemandeMateriel>

    fun existsByReference(reference: String): Boolean

    fun findFirstByReferenceStartingWithOrderByReferenceDesc(prefix: String): DemandeMateriel?
}
