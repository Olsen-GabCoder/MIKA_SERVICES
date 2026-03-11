package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.modules.bareme.entity.CorpsEtatBareme
import org.springframework.data.jpa.repository.JpaRepository

interface CorpsEtatBaremeRepository : JpaRepository<CorpsEtatBareme, Long> {

    fun findAllByOrderByOrdreAffichageAsc(): List<CorpsEtatBareme>

    fun findByCode(code: String): CorpsEtatBareme?
}
