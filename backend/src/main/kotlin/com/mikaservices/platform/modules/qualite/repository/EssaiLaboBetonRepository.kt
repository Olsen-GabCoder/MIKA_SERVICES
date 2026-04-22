package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.EssaiLaboratoireBeton
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface EssaiLaboBetonRepository : JpaRepository<EssaiLaboratoireBeton, Long> {

    fun findByProjetId(projetId: Long, pageable: Pageable): Page<EssaiLaboratoireBeton>

    fun findByProjetIdAndMoisReference(projetId: Long, moisReference: String): Optional<EssaiLaboratoireBeton>

    fun findByMoisReference(moisReference: String): List<EssaiLaboratoireBeton>
}
