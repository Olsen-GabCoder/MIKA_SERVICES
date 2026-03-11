package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.modules.bareme.entity.CoefficientEloignement
import org.springframework.data.jpa.repository.JpaRepository

interface CoefficientEloignementRepository : JpaRepository<CoefficientEloignement, Long> {

    fun findAllByOrderByOrdreAffichageAscNomAsc(): List<CoefficientEloignement>
}
