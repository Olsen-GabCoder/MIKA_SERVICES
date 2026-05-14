package com.mikaservices.platform.modules.sallereunion.repository

import com.mikaservices.platform.modules.sallereunion.entity.SalleReunion
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SalleReunionRepository : JpaRepository<SalleReunion, Long> {
    /** MVP single-salle : retourne la premiere (et unique) salle. */
    fun findFirstByOrderByIdAsc(): SalleReunion?
}
