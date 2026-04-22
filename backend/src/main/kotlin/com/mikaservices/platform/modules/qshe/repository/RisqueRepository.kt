package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.modules.qshe.entity.Risque
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface RisqueRepository : JpaRepository<Risque, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Risque>
    fun findByReference(reference: String): Risque?
    fun countByProjetId(projetId: Long): Long
    fun findByProjetIdAndActifTrue(projetId: Long, pageable: Pageable): Page<Risque>

    @Query("SELECT COUNT(r) FROM Risque r WHERE r.projet.id = :pid AND r.actif = true AND r.niveauBrut IN :niveaux")
    fun countActifsByProjetAndNiveauBrutIn(@Param("pid") projetId: Long, @Param("niveaux") niveaux: List<NiveauRisque>): Long

    @Query("SELECT COUNT(r) FROM Risque r WHERE r.projet.id = :pid AND r.actif = true")
    fun countActifsByProjet(@Param("pid") projetId: Long): Long
}
