package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.Certification
import com.mikaservices.platform.modules.qshe.enums.TypeCertification
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface CertificationRepository : JpaRepository<Certification, Long> {
    fun findByUserId(userId: Long, pageable: Pageable): Page<Certification>
    fun findByUserId(userId: Long): List<Certification>
    fun findByTypeCertification(type: TypeCertification): List<Certification>

    @Query("SELECT c FROM Certification c WHERE c.dateExpiration IS NOT NULL AND c.dateExpiration <= :seuil AND c.dateExpiration >= :today")
    fun findExpirantAvant(@Param("today") today: LocalDate, @Param("seuil") seuil: LocalDate): List<Certification>

    @Query("SELECT c FROM Certification c WHERE c.dateExpiration IS NOT NULL AND c.dateExpiration < :today")
    fun findExpirees(@Param("today") today: LocalDate): List<Certification>

    @Query("SELECT COUNT(c) FROM Certification c WHERE c.dateExpiration IS NOT NULL AND c.dateExpiration < :today")
    fun countExpirees(@Param("today") today: LocalDate): Long
}
