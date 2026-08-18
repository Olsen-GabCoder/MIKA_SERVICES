package com.mikaservices.platform.modules.chantier.repository

import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.chantier.entity.AffectationUtilisateurProjet
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AffectationUtilisateurProjetRepository : JpaRepository<AffectationUtilisateurProjet, Long> {
    fun findByProjetId(projetId: Long): List<AffectationUtilisateurProjet>
    fun findByUserId(userId: Long): List<AffectationUtilisateurProjet>
    fun findByUserIdAndStatutIn(userId: Long, statuts: Collection<StatutAffectation>): List<AffectationUtilisateurProjet>
    fun findByProjetIdAndStatutIn(projetId: Long, statuts: Collection<StatutAffectation>): List<AffectationUtilisateurProjet>
    fun findByStatutIn(statuts: Collection<StatutAffectation>): List<AffectationUtilisateurProjet>
}
