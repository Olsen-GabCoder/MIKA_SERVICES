package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.common.enums.GraviteNonConformite
import com.mikaservices.platform.common.enums.StatutNonConformite
import com.mikaservices.platform.modules.qualite.entity.NonConformite
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface NonConformiteRepository : JpaRepository<NonConformite, Long> {
    fun findByControleQualiteId(controleId: Long, pageable: Pageable): Page<NonConformite>
    fun findByStatut(statut: StatutNonConformite): List<NonConformite>
    fun findByGravite(gravite: GraviteNonConformite): List<NonConformite>
    fun findByReference(reference: String): NonConformite?
    fun findByResponsableTraitementId(userId: Long): List<NonConformite>

    @Query("SELECT nc FROM NonConformite nc WHERE nc.statut NOT IN ('CLOTUREE') AND nc.dateEcheanceCorrection <= :date")
    fun findEnRetard(@Param("date") date: LocalDate): List<NonConformite>

    @Query("SELECT COUNT(nc) FROM NonConformite nc WHERE nc.controleQualite.projet.id = :projetId AND nc.statut NOT IN ('CLOTUREE')")
    fun countOuvertesParProjet(@Param("projetId") projetId: Long): Long

    @Query("SELECT nc.gravite, COUNT(nc) FROM NonConformite nc WHERE nc.controleQualite.projet.id = :projetId GROUP BY nc.gravite")
    fun countByGraviteForProjet(@Param("projetId") projetId: Long): List<Array<Any>>
}
