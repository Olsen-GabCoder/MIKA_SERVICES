package com.mikaservices.platform.modules.communication.repository

import com.mikaservices.platform.modules.communication.entity.Message
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface MessageRepository : JpaRepository<Message, Long> {
    fun findByDestinataire_IdOrderByDateEnvoiDesc(destinataireId: Long, pageable: Pageable): Page<Message>
    fun findByExpediteur_IdOrderByDateEnvoiDesc(expediteurId: Long, pageable: Pageable): Page<Message>

    @Query("SELECT m FROM Message m WHERE m.destinataire.id = :userId AND m.expediteur.id NOT IN :excludedPeerIds ORDER BY m.dateEnvoi DESC")
    fun findByDestinataire_IdAndExpediteur_IdNotInOrderByDateEnvoiDesc(
        @Param("userId") userId: Long,
        @Param("excludedPeerIds") excludedPeerIds: Collection<Long>,
        pageable: Pageable
    ): Page<Message>

    @Query("SELECT m FROM Message m WHERE m.expediteur.id = :userId AND m.destinataire.id NOT IN :excludedPeerIds ORDER BY m.dateEnvoi DESC")
    fun findByExpediteur_IdAndDestinataire_IdNotInOrderByDateEnvoiDesc(
        @Param("userId") userId: Long,
        @Param("excludedPeerIds") excludedPeerIds: Collection<Long>,
        pageable: Pageable
    ): Page<Message>

    @Query("SELECT m FROM Message m WHERE m.destinataire.id = :userId AND m.expediteur.id NOT IN :excludedPeerIds AND m.id NOT IN :excludedMessageIds ORDER BY m.dateEnvoi DESC")
    fun findRecusExcluding(
        @Param("userId") userId: Long,
        @Param("excludedPeerIds") excludedPeerIds: Collection<Long>,
        @Param("excludedMessageIds") excludedMessageIds: Collection<Long>,
        pageable: Pageable
    ): Page<Message>

    @Query("SELECT m FROM Message m WHERE m.expediteur.id = :userId AND m.destinataire.id NOT IN :excludedPeerIds AND m.id NOT IN :excludedMessageIds ORDER BY m.dateEnvoi DESC")
    fun findEnvoyesExcluding(
        @Param("userId") userId: Long,
        @Param("excludedPeerIds") excludedPeerIds: Collection<Long>,
        @Param("excludedMessageIds") excludedMessageIds: Collection<Long>,
        pageable: Pageable
    ): Page<Message>

    @Query("SELECT m FROM Message m WHERE (m.expediteur.id = :userId OR m.destinataire.id = :userId) ORDER BY m.dateEnvoi DESC")
    fun findAllByUser(@Param("userId") userId: Long, pageable: Pageable): Page<Message>

    @Query("SELECT m FROM Message m WHERE ((m.expediteur.id = :userId1 AND m.destinataire.id = :userId2) OR (m.expediteur.id = :userId2 AND m.destinataire.id = :userId1)) ORDER BY m.dateEnvoi ASC")
    fun findConversation(@Param("userId1") userId1: Long, @Param("userId2") userId2: Long, pageable: Pageable): Page<Message>

    @Query("SELECT COUNT(m) FROM Message m WHERE m.destinataire.id = :userId AND m.lu = false")
    fun countNonLus(@Param("userId") userId: Long): Long
}
