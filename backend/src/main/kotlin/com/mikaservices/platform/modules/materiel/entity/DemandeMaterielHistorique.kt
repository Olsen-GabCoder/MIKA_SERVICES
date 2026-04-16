package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutDemandeMateriel
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "demandes_materiel_historique",
    indexes = [
        Index(name = "idx_dma_hist_demande", columnList = "demande_id"),
        Index(name = "idx_dma_hist_date", columnList = "date_transition"),
    ]
)
class DemandeMaterielHistorique(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    var demande: DemandeMateriel,

    @Enumerated(EnumType.STRING)
    @Column(name = "de_statut", length = 40)
    var deStatut: StatutDemandeMateriel? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "vers_statut", nullable = false, length = 40)
    var versStatut: StatutDemandeMateriel,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(name = "date_transition", nullable = false)
    var dateTransition: LocalDateTime = LocalDateTime.now(),

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null,
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DemandeMaterielHistorique) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
}
