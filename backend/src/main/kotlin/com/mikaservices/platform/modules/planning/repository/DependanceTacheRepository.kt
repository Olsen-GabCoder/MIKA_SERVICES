package com.mikaservices.platform.modules.planning.repository

import com.mikaservices.platform.modules.planning.entity.DependanceTache
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface DependanceTacheRepository : JpaRepository<DependanceTache, Long> {

    @EntityGraph(attributePaths = ["tacheSource", "tacheCible"])
    @Query("SELECT d FROM DependanceTache d WHERE d.tacheSource.projet.id = :projetId OR d.tacheCible.projet.id = :projetId")
    fun findByProjetId(@Param("projetId") projetId: Long): List<DependanceTache>

    @EntityGraph(attributePaths = ["tacheSource", "tacheCible"])
    @Query("SELECT d FROM DependanceTache d WHERE d.tacheSource.id = :tacheId OR d.tacheCible.id = :tacheId")
    fun findByTacheId(@Param("tacheId") tacheId: Long): List<DependanceTache>

    fun existsByTacheSourceIdAndTacheCibleId(sourceId: Long, cibleId: Long): Boolean
}
