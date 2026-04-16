package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutMouvementEngin
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "mouvements_engin",
    indexes = [
        Index(name = "idx_mvt_engin_engin", columnList = "engin_id"),
        Index(name = "idx_mvt_engin_statut", columnList = "statut"),
        Index(name = "idx_mvt_engin_dest", columnList = "projet_destination_id"),
    ]
)
class MouvementEngin(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    /** Chantier source ; null si départ depuis dépôt / hors projet. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_origine_id")
    var projetOrigine: Projet? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_destination_id", nullable = false)
    var projetDestination: Projet,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiateur_user_id", nullable = false)
    var initiateur: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    var statut: StatutMouvementEngin = StatutMouvementEngin.EN_ATTENTE_DEPART,

    @Column(name = "date_demande", nullable = false)
    var dateDemande: LocalDateTime = LocalDateTime.now(),

    @Column(name = "date_depart_confirmee")
    var dateDepartConfirmee: LocalDateTime? = null,

    @Column(name = "date_reception_confirmee")
    var dateReceptionConfirmee: LocalDateTime? = null,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is MouvementEngin) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
    override fun toString(): String = "MouvementEngin(id=$id, statut=$statut)"
}
