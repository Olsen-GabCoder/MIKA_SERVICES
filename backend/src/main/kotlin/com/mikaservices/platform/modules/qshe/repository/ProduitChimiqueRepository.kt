package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.ProduitChimique
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface ProduitChimiqueRepository : JpaRepository<ProduitChimique, Long> {
    fun findByActifTrue(pageable: Pageable): Page<ProduitChimique>
    fun findByCode(code: String): ProduitChimique?
}
