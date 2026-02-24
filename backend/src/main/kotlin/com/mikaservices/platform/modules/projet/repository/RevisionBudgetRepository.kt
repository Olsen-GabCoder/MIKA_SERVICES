package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.modules.projet.entity.RevisionBudget
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RevisionBudgetRepository : JpaRepository<RevisionBudget, Long> {
    fun findByProjetId(projetId: Long): List<RevisionBudget>
    fun findByProjetIdOrderByDateRevisionDesc(projetId: Long): List<RevisionBudget>
}
