package com.mikaservices.platform.modules.projet.repository

import com.mikaservices.platform.common.enums.TypeClient
import com.mikaservices.platform.modules.projet.entity.Client
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ClientRepository : JpaRepository<Client, Long> {
    fun findByCode(code: String): Optional<Client>
    fun existsByCode(code: String): Boolean
    fun findByActifTrue(): List<Client>
    fun findByType(type: TypeClient): List<Client>
    fun findByActifTrue(pageable: Pageable): Page<Client>
    fun findByNomContainingIgnoreCaseAndActifTrue(nom: String, pageable: Pageable): Page<Client>
}
