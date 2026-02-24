package com.mikaservices.platform.modules.chantier.repository

import com.mikaservices.platform.modules.chantier.entity.ZoneChantier
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ZoneChantierRepository : JpaRepository<ZoneChantier, Long> {
    fun findByProjetId(projetId: Long): List<ZoneChantier>
    fun findByProjetIdAndActifTrue(projetId: Long): List<ZoneChantier>
    fun existsByCode(code: String): Boolean
}
