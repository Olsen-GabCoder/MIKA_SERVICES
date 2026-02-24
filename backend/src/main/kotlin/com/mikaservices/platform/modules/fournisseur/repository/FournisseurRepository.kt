package com.mikaservices.platform.modules.fournisseur.repository

import com.mikaservices.platform.modules.fournisseur.entity.Fournisseur
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface FournisseurRepository : JpaRepository<Fournisseur, Long> {
    fun findByCode(code: String): Fournisseur?
    fun findByActifTrue(pageable: Pageable): Page<Fournisseur>

    @Query("SELECT f FROM Fournisseur f WHERE LOWER(f.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(f.specialite) LIKE LOWER(CONCAT('%', :q, '%'))")
    fun search(@Param("q") query: String, pageable: Pageable): Page<Fournisseur>
}
