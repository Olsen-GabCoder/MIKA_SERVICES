package com.mikaservices.platform.modules.communication.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "messages", indexes = [
    Index(name = "idx_msg_expediteur", columnList = "expediteur_id"),
    Index(name = "idx_msg_destinataire", columnList = "destinataire_id"),
    Index(name = "idx_msg_lu", columnList = "lu"),
    Index(name = "idx_msg_date", columnList = "date_envoi")
])
class Message(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", nullable = false)
    var expediteur: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", nullable = false)
    var destinataire: User,

    @Column(name = "sujet", length = 300)
    var sujet: String? = null,

    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    var contenu: String,

    @Column(name = "date_envoi", nullable = false)
    var dateEnvoi: LocalDateTime = LocalDateTime.now(),

    @Column(name = "lu")
    var lu: Boolean = false,

    @Column(name = "date_lecture")
    var dateLecture: LocalDateTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: Message? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Message) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: contenu.hashCode()
    override fun toString(): String = "Message(id=$id, sujet='$sujet', lu=$lu)"
}
