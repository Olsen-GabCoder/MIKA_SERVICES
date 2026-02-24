package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.StatutProjet
import com.mikaservices.platform.common.enums.TypeProjet
import com.mikaservices.platform.modules.projet.entity.Projet
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ProjetRepository : JpaRepository<Projet, Long>, JpaSpecificationExecutor<Projet> {
    fun findByCodeProjet(codeProjet: String): Optional<Projet>
    fun findByActifTrue(pageable: Pageable): Page<Projet>
    fun findByStatut(statut: StatutProjet): List<Projet>
    fun findByStatutAndActifTrue(statut: StatutProjet): List<Projet>
    fun findByType(type: TypeProjet): List<Projet>
    fun findByClientId(clientId: Long): List<Projet>
    fun findByResponsableProjetId(userId: Long): List<Projet>

    @Query("SELECT p FROM Projet p WHERE p.actif = true AND " +
           "(LOWER(p.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.numeroMarche) LIKE LOWER(CONCAT('%', :search, '%')))")
    fun search(@Param("search") search: String, pageable: Pageable): Page<Projet>

    @Query("SELECT COUNT(p) FROM Projet p WHERE p.statut = :statut AND p.actif = true")
    fun countByStatut(@Param("statut") statut: StatutProjet): Long
}
