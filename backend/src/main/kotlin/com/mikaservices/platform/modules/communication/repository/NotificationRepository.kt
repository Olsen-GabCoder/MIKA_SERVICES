package com.mikaservices.platform.modules.communication.repository

import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.communication.entity.Notification
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface NotificationRepository : JpaRepository<Notification, Long> {
    fun findByDestinataire_IdOrderByDateCreationDesc(destinataireId: Long, pageable: Pageable): Page<Notification>
    fun findByDestinataire_IdAndLuFalseOrderByDateCreationDesc(destinataireId: Long): List<Notification>
    fun findByTypeNotification(type: TypeNotification): List<Notification>

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.destinataire.id = :userId AND n.lu = false")
    fun countNonLues(@Param("userId") userId: Long): Long

    @Modifying
    @Query("UPDATE Notification n SET n.lu = true, n.dateLecture = CURRENT_TIMESTAMP WHERE n.destinataire.id = :userId AND n.lu = false")
    fun marquerToutesLues(@Param("userId") userId: Long): Int
}
