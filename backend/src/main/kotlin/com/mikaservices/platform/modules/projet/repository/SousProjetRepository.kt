package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.StatutSousProjet
import com.mikaservices.platform.modules.projet.entity.SousProjet
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface SousProjetRepository : JpaRepository<SousProjet, Long> {
    fun findByCode(code: String): Optional<SousProjet>
    fun existsByCode(code: String): Boolean
    fun findByProjetId(projetId: Long): List<SousProjet>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<SousProjet>
    fun findByStatut(statut: StatutSousProjet): List<SousProjet>
    fun findByResponsableId(userId: Long): List<SousProjet>
}
