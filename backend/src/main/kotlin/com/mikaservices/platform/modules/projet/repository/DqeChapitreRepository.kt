package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.modules.projet.entity.DqeChapitre
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface DqeChapitreRepository : JpaRepository<DqeChapitre, Long> {
    fun findByProjetIdOrderByOrdreAsc(projetId: Long): List<DqeChapitre>

    fun countByProjetId(projetId: Long): Long

    @Query("SELECT COALESCE(MAX(c.ordre), 0) FROM DqeChapitre c WHERE c.projet.id = :projetId")
    fun findMaxOrdreByProjetId(projetId: Long): Int

    fun existsByProjetIdAndNumero(projetId: Long, numero: String): Boolean
}
