package com.mikaservices.platform.modules.securite.repository

import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.modules.securite.entity.Risque
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface RisqueRepository : JpaRepository<Risque, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Risque>
    fun findByNiveau(niveau: NiveauRisque): List<Risque>
    fun findByActifTrue(): List<Risque>

    @Query("SELECT COUNT(r) FROM Risque r WHERE r.projet.id = :projetId AND r.actif = true")
    fun countActifsParProjet(@Param("projetId") projetId: Long): Long

    @Query("SELECT COUNT(r) FROM Risque r WHERE r.projet.id = :projetId AND r.niveau IN ('ELEVE', 'CRITIQUE') AND r.actif = true")
    fun countCritiquesParProjet(@Param("projetId") projetId: Long): Long
}
