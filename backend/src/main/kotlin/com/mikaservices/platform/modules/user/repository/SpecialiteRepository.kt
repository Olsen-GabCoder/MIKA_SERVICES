package com.mikaservices.platform.modules.user.repository

import com.mikaservices.platform.modules.user.entity.Specialite
import com.mikaservices.platform.common.enums.TypeSpecialite
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface SpecialiteRepository : JpaRepository<Specialite, Long> {
    fun findByCode(code: String): Optional<Specialite>
    fun findByActifTrue(): List<Specialite>
    fun findByCategorieAndActifTrue(categorie: TypeSpecialite): List<Specialite>
    fun existsByCode(code: String): Boolean
}
