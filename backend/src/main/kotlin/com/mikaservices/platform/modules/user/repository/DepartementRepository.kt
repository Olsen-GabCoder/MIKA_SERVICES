package com.mikaservices.platform.modules.user.repository

import com.mikaservices.platform.modules.user.entity.Departement
import com.mikaservices.platform.common.enums.TypeDepartement
import com.mikaservices.platform.modules.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DepartementRepository : JpaRepository<Departement, Long> {
    fun findByCode(code: String): Optional<Departement>
    fun findByActifTrue(): List<Departement>
    fun findByTypeAndActifTrue(type: TypeDepartement): List<Departement>
    fun findByResponsable(responsable: User): List<Departement>
    fun existsByCode(code: String): Boolean
}
