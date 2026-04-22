package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.SectionEvenement
import com.mikaservices.platform.modules.qualite.enums.NumeroSection
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface SectionEvenementRepository : JpaRepository<SectionEvenement, Long> {

    fun findByEvenementIdAndNumeroSection(evenementId: Long, numeroSection: NumeroSection): Optional<SectionEvenement>

    fun findByEvenementId(evenementId: Long): List<SectionEvenement>
}
