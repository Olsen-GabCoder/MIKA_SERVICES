package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.common.enums.StatutControleQualite
import com.mikaservices.platform.common.enums.TypeControle
import com.mikaservices.platform.modules.qualite.entity.ControleQualite
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface ControleQualiteRepository : JpaRepository<ControleQualite, Long> {
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<ControleQualite>
    fun findByStatut(statut: StatutControleQualite): List<ControleQualite>
    fun findByTypeControle(typeControle: TypeControle): List<ControleQualite>
    fun findByReference(reference: String): ControleQualite?
    fun findByInspecteurId(inspecteurId: Long): List<ControleQualite>

    @Query("SELECT COUNT(c) FROM ControleQualite c WHERE c.projet.id = :projetId AND c.statut = :statut")
    fun countByProjetIdAndStatut(@Param("projetId") projetId: Long, @Param("statut") statut: StatutControleQualite): Long

    @Query("SELECT COUNT(c) FROM ControleQualite c WHERE c.projet.id = :projetId AND c.statut = 'NON_CONFORME'")
    fun countNonConformesByProjet(@Param("projetId") projetId: Long): Long
}
