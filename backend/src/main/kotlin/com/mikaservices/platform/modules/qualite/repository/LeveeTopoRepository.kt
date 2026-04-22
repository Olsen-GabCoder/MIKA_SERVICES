package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.LeveeTopographique
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface LeveeTopoRepository : JpaRepository<LeveeTopographique, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<LeveeTopographique>

    fun findByProjetIdAndMoisReference(projetId: Long, moisReference: String): Optional<LeveeTopographique>

    fun findByMoisReference(moisReference: String): List<LeveeTopographique>
}
