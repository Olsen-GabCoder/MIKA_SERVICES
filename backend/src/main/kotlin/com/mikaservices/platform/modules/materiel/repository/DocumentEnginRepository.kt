package com.mikaservices.platform.modules.materiel.repository

import com.mikaservices.platform.modules.materiel.entity.DocumentEngin
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface DocumentEnginRepository : JpaRepository<DocumentEngin, Long> {
    fun findByEnginId(enginId: Long, pageable: Pageable): Page<DocumentEngin>
    fun findByEnginId(enginId: Long): List<DocumentEngin>
    fun findByEnginIdAndDateExpirationBefore(enginId: Long, date: LocalDate): List<DocumentEngin>

    /** Documents dont l'expiration est entre aujourd'hui et la date limite (inclus) */
    @Query("SELECT d FROM DocumentEngin d JOIN FETCH d.engin e WHERE d.dateExpiration IS NOT NULL AND d.dateExpiration >= :today AND d.dateExpiration <= :limite AND e.actif = true ORDER BY d.dateExpiration ASC")
    fun findDocumentsExpirantBientot(today: java.time.LocalDate, limite: java.time.LocalDate): List<DocumentEngin>

    /** Documents deja expires */
    @Query("SELECT d FROM DocumentEngin d JOIN FETCH d.engin e WHERE d.dateExpiration IS NOT NULL AND d.dateExpiration < :today AND e.actif = true ORDER BY d.dateExpiration ASC")
    fun findDocumentsExpires(today: java.time.LocalDate): List<DocumentEngin>
}
