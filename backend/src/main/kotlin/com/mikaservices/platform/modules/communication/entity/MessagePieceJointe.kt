package com.mikaservices.platform.modules.communication.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

@Entity
@Table(name = "message_pieces_jointes", indexes = [
    Index(name = "idx_pj_message", columnList = "message_id")
])
class MessagePieceJointe(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    var message: Message,

    @Column(name = "nom_original", nullable = false, length = 500)
    var nomOriginal: String,

    @Column(name = "nom_stockage", nullable = false, length = 500)
    var nomStockage: String,

    @Column(name = "chemin_stockage", nullable = false, length = 1000)
    var cheminStockage: String,

    @Column(name = "type_mime", length = 100)
    var typeMime: String? = null,

    @Column(name = "taille_octets")
    var tailleOctets: Long = 0
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is MessagePieceJointe) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: nomStockage.hashCode()
}
