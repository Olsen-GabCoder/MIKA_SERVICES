package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.TypePartenaire
import com.mikaservices.platform.modules.projet.entity.Partenaire
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface PartenaireRepository : JpaRepository<Partenaire, Long> {
    fun findByCode(code: String): Optional<Partenaire>
    fun existsByCode(code: String): Boolean
    fun findByActifTrue(): List<Partenaire>
    fun findByType(type: TypePartenaire): List<Partenaire>
    fun findByActifTrue(pageable: Pageable): Page<Partenaire>
}
