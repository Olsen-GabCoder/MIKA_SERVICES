package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.PhaseEtude
import com.mikaservices.platform.modules.projet.entity.AvancementEtudeProjet
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AvancementEtudeProjetRepository : JpaRepository<AvancementEtudeProjet, Long> {
    fun findByProjetIdOrderByPhase(projetId: Long): List<AvancementEtudeProjet>
    fun findByProjetIdAndPhase(projetId: Long, phase: PhaseEtude): AvancementEtudeProjet?
}
