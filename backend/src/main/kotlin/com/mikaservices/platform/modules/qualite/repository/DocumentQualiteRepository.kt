package com.mikaservices.platform.modules.qualite.repository

import com.mikaservices.platform.modules.qualite.entity.DocumentQualite
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface DocumentQualiteRepository : JpaRepository<DocumentQualite, Long> {

    fun findByActif(actif: Boolean, pageable: Pageable): Page<DocumentQualite>

    fun findByCodeDocument(codeDocument: String): Optional<DocumentQualite>
}
