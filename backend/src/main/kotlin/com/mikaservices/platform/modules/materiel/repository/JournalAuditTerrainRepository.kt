package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.JournalAuditTerrain
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface JournalAuditTerrainRepository : JpaRepository<JournalAuditTerrain, Long> {

    @Query(
        """
        SELECT j FROM JournalAuditTerrain j
        WHERE (:action IS NULL OR j.action = :action)
          AND (:entiteType IS NULL OR j.entiteType = :entiteType)
          AND (:acteurId IS NULL OR j.acteurId = :acteurId)
        """
    )
    fun findFiltered(
        @Param("action") action: String?,
        @Param("entiteType") entiteType: String?,
        @Param("acteurId") acteurId: Long?,
        pageable: Pageable,
    ): Page<JournalAuditTerrain>

    fun findByActionAndEntiteTypeAndEntiteId(
        action: String,
        entiteType: String,
        entiteId: Long,
    ): List<JournalAuditTerrain>
}
