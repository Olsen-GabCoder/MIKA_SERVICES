package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.StatutPrevision
import com.mikaservices.platform.common.enums.TypePrevision
import com.mikaservices.platform.modules.projet.entity.Prevision
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PrevisionRepository : JpaRepository<Prevision, Long> {
    fun findByProjetId(projetId: Long): List<Prevision>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Prevision>
    fun findByProjetIdAndAnnee(projetId: Long, annee: Int): List<Prevision>
    fun findByProjetIdAndSemaineAndAnnee(projetId: Long, semaine: Int, annee: Int): List<Prevision>
    fun findByType(type: TypePrevision): List<Prevision>
    fun findByStatut(statut: StatutPrevision): List<Prevision>
}
