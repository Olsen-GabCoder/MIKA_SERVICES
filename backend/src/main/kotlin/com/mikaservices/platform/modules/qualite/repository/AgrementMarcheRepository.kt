package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.AgrementMarche
import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface AgrementMarcheRepository : JpaRepository<AgrementMarche, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<AgrementMarche>

    fun findByProjetIdAndStatut(projetId: Long, statut: StatutAgrement, pageable: Pageable): Page<AgrementMarche>

    fun countByProjetId(projetId: Long): Long

    @Query(
        "SELECT a.statut, COUNT(a) FROM AgrementMarche a " +
        "WHERE a.projet.id = :pid AND a.moisReference = :mois " +
        "GROUP BY a.statut"
    )
    fun countByProjetAndMois(
        @Param("pid") projetId: Long,
        @Param("mois") moisReference: String
    ): List<Array<Any>>

    @Query(
        "SELECT COUNT(a) FROM AgrementMarche a " +
        "WHERE a.projet.id = :pid AND a.moisReference = :mois"
    )
    fun countTotalByProjetAndMois(@Param("pid") projetId: Long, @Param("mois") moisReference: String): Long

    // --- Cross-projet (vue globale) ---

    fun findByStatut(statut: StatutAgrement, pageable: Pageable): Page<AgrementMarche>

    @Query(
        "SELECT a.statut, COUNT(a) FROM AgrementMarche a " +
        "WHERE a.projet.id = :pid GROUP BY a.statut"
    )
    fun countByProjetGroupByStatut(@Param("pid") projetId: Long): List<Array<Any>>

    @Query("SELECT a.statut, COUNT(a) FROM AgrementMarche a GROUP BY a.statut")
    fun countAllGroupByStatut(): List<Array<Any>>

    @Query(
        "SELECT a.statut, COUNT(a) FROM AgrementMarche a " +
        "WHERE a.moisReference = :mois GROUP BY a.statut"
    )
    fun countByMois(@Param("mois") moisReference: String): List<Array<Any>>
}
