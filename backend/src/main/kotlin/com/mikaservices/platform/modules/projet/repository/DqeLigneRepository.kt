package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.modules.projet.entity.DqeLigne
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface DqeLigneRepository : JpaRepository<DqeLigne, Long> {
    fun findByChapitreIdOrderByOrdreAsc(chapitreId: Long): List<DqeLigne>

    fun countByChapitreId(chapitreId: Long): Long

    @Query("SELECT COALESCE(MAX(l.ordre), 0) FROM DqeLigne l WHERE l.chapitre.id = :chapitreId")
    fun findMaxOrdreByChapitreId(chapitreId: Long): Int

    @Query("SELECT l FROM DqeLigne l JOIN l.chapitre c WHERE c.projet.id = :projetId ORDER BY c.ordre, l.ordre")
    fun findAllByProjetId(projetId: Long): List<DqeLigne>
}
