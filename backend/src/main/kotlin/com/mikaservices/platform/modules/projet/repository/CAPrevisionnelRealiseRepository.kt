package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.modules.projet.entity.CAPrevisionnelRealise
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface CAPrevisionnelRealiseRepository : JpaRepository<CAPrevisionnelRealise, Long> {
    fun findByProjetId(projetId: Long): List<CAPrevisionnelRealise>
    fun findByProjetIdAndAnnee(projetId: Long, annee: Int): List<CAPrevisionnelRealise>
    fun findByProjetIdAndMoisAndAnnee(projetId: Long, mois: Int, annee: Int): Optional<CAPrevisionnelRealise>
    fun findByProjetIdOrderByAnneeAscMoisAsc(projetId: Long): List<CAPrevisionnelRealise>
}
