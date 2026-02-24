package com.mikaservices.platform.modules.chantier.repository

import com.mikaservices.platform.common.enums.StatutInstallation
import com.mikaservices.platform.modules.chantier.entity.InstallationChantier
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InstallationChantierRepository : JpaRepository<InstallationChantier, Long> {
    fun findByProjetId(projetId: Long): List<InstallationChantier>
    fun findByProjetIdAndStatut(projetId: Long, statut: StatutInstallation): List<InstallationChantier>
}
