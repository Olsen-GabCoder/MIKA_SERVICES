package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.modules.bareme.entity.FournisseurBareme
import org.springframework.data.jpa.repository.JpaRepository

interface FournisseurBaremeRepository : JpaRepository<FournisseurBareme, Long> {

    fun findByNomIgnoreCase(nom: String): FournisseurBareme?

    fun findAllByOrderByNomAsc(): List<FournisseurBareme>
}
