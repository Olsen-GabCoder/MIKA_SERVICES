package com.mikaservices.platform.modules.fournisseur.repository

import com.mikaservices.platform.common.enums.StatutCommande
import com.mikaservices.platform.modules.fournisseur.entity.Commande
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CommandeRepository : JpaRepository<Commande, Long> {
    fun findByFournisseurId(fournisseurId: Long, pageable: Pageable): Page<Commande>
    fun findByProjetId(projetId: Long, pageable: Pageable): Page<Commande>
    fun findByStatut(statut: StatutCommande): List<Commande>
    fun findByReference(reference: String): Commande?
}
