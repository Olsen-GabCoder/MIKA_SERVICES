package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.DemandeReception
import com.mikaservices.platform.modules.qualite.enums.NatureReception
import com.mikaservices.platform.modules.qualite.enums.SousTypeReception
import com.mikaservices.platform.modules.qualite.enums.StatutReception
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface DemandeReceptionRepository : JpaRepository<DemandeReception, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<DemandeReception>

    fun findByProjetIdAndNature(projetId: Long, nature: NatureReception, pageable: Pageable): Page<DemandeReception>

    fun findByProjetIdAndNatureAndSousType(
        projetId: Long, nature: NatureReception, sousType: SousTypeReception, pageable: Pageable
    ): Page<DemandeReception>

    fun findByProjetIdAndSousType(projetId: Long, sousType: SousTypeReception, pageable: Pageable): Page<DemandeReception>

    // --- Cross-projet (vue globale) ---

    fun findByNature(nature: NatureReception, pageable: Pageable): Page<DemandeReception>

    fun findByNatureAndSousType(nature: NatureReception, sousType: SousTypeReception, pageable: Pageable): Page<DemandeReception>

    fun findBySousType(sousType: SousTypeReception, pageable: Pageable): Page<DemandeReception>

    fun findByReference(reference: String): DemandeReception?

    fun countByProjetId(projetId: Long): Long

    @Query(
        "SELECT d.statut, COUNT(d) FROM DemandeReception d " +
        "WHERE d.projet.id = :pid AND d.nature = :nat AND d.sousType = :st AND d.moisReference = :mois " +
        "GROUP BY d.statut"
    )
    fun countByProjetAndNatureAndSousTypeAndMois(
        @Param("pid") projetId: Long,
        @Param("nat") nature: NatureReception,
        @Param("st") sousType: SousTypeReception,
        @Param("mois") moisReference: String
    ): List<Array<Any>>

    @Query(
        "SELECT COUNT(d) FROM DemandeReception d " +
        "WHERE d.projet.id = :pid AND d.moisReference = :mois"
    )
    fun countByProjetAndMois(@Param("pid") projetId: Long, @Param("mois") moisReference: String): Long

    // --- Cross-projet synthèse ---

    @Query(
        "SELECT d.statut, COUNT(d) FROM DemandeReception d " +
        "WHERE d.nature = :nat AND d.sousType = :st AND d.moisReference = :mois " +
        "GROUP BY d.statut"
    )
    fun countByNatureAndSousTypeAndMois(
        @Param("nat") nature: NatureReception,
        @Param("st") sousType: SousTypeReception,
        @Param("mois") moisReference: String
    ): List<Array<Any>>
}
