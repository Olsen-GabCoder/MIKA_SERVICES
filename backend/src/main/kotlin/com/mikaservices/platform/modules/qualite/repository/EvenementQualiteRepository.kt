package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.EvenementQualite
import com.mikaservices.platform.modules.qualite.enums.StatutEvenement
import com.mikaservices.platform.modules.qualite.enums.TypeEvenement
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface EvenementQualiteRepository : JpaRepository<EvenementQualite, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<EvenementQualite>

    fun findByProjetIdAndTypeEvenement(projetId: Long, type: TypeEvenement, pageable: Pageable): Page<EvenementQualite>

    fun findByProjetIdAndStatut(projetId: Long, statut: StatutEvenement, pageable: Pageable): Page<EvenementQualite>

    fun findByProjetIdAndTypeEvenementAndStatut(
        projetId: Long, type: TypeEvenement, statut: StatutEvenement, pageable: Pageable
    ): Page<EvenementQualite>

    // --- Cross-projet (vue globale) ---

    fun findByTypeEvenement(type: TypeEvenement, pageable: Pageable): Page<EvenementQualite>

    fun findByStatut(statut: StatutEvenement, pageable: Pageable): Page<EvenementQualite>

    fun findByTypeEvenementAndStatut(type: TypeEvenement, statut: StatutEvenement, pageable: Pageable): Page<EvenementQualite>

    @Query("SELECT COUNT(e) FROM EvenementQualite e WHERE e.projet.id = :pid")
    fun countByProjetId(@Param("pid") projetId: Long): Long

    @Query(
        "SELECT e.statut, COUNT(e) FROM EvenementQualite e " +
        "WHERE e.projet.id = :pid GROUP BY e.statut"
    )
    fun countByProjetGroupByStatut(@Param("pid") projetId: Long): List<Array<Any>>

    @Query("SELECT e.statut, COUNT(e) FROM EvenementQualite e GROUP BY e.statut")
    fun countAllGroupByStatut(): List<Array<Any>>
}
