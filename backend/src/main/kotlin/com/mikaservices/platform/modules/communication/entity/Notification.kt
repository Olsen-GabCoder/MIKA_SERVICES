package com.mikaservices.platform.modules.communication.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeNotification
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "notifications", indexes = [
    Index(name = "idx_notif_destinataire", columnList = "destinataire_id"),
    Index(name = "idx_notif_lu", columnList = "lu"),
    Index(name = "idx_notif_type", columnList = "type_notification")
])
class Notification(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", nullable = false)
    var destinataire: User,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "contenu", columnDefinition = "TEXT")
    var contenu: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_notification", nullable = false, length = 25)
    var typeNotification: TypeNotification,

    @Column(name = "lien", length = 500)
    var lien: String? = null,

    @Column(name = "lu")
    var lu: Boolean = false,

    @Column(name = "date_creation", nullable = false)
    var dateCreation: LocalDateTime = LocalDateTime.now(),

    @Column(name = "date_lecture")
    var dateLecture: LocalDateTime? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Notification) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: titre.hashCode()
    override fun toString(): String = "Notification(id=$id, titre='$titre', lu=$lu)"
}
