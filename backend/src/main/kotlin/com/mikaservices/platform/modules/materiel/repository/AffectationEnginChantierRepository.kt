package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.materiel.entity.AffectationEnginChantier
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface AffectationEnginChantierRepository : JpaRepository<AffectationEnginChantier, Long> {
    fun findByProjetId(projetId: Long): List<AffectationEnginChantier>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<AffectationEnginChantier>
    fun countByProjetId(projetId: Long): Long
    fun findByEnginId(enginId: Long): List<AffectationEnginChantier>
    fun findByEnginIdAndStatut(enginId: Long, statut: StatutAffectation): List<AffectationEnginChantier>
    fun findByEnginIdInAndStatut(enginIds: Collection<Long>, statut: StatutAffectation): List<AffectationEnginChantier>

    @Query(
        """
        SELECT a FROM AffectationEnginChantier a
        WHERE a.engin.id = :enginId AND a.projet.id = :projetId
        AND a.statut IN :statuts AND a.dateFin IS NULL
        """
    )
    fun findOuvertesParEnginEtProjet(
        @Param("enginId") enginId: Long,
        @Param("projetId") projetId: Long,
        @Param("statuts") statuts: Collection<StatutAffectation>,
    ): List<AffectationEnginChantier>
}
