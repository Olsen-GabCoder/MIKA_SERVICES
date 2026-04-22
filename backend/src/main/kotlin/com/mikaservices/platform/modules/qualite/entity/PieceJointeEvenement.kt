package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

@Entity
@Table(name = "qualite_pieces_jointes_evenement")
class PieceJointeEvenement(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    var section: SectionEvenement,

    @Column(name = "url_fichier", nullable = false, length = 500)
    var urlFichier: String,

    @Column(name = "legende", length = 300)
    var legende: String? = null,

    @Column(name = "ordre_affichage", nullable = false)
    var ordreAffichage: Int = 0,

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PieceJointeEvenement) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
