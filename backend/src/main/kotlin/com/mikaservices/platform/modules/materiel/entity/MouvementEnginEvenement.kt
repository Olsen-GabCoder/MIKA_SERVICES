package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.TypeMouvementEnginEvenement
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "mouvements_engin_evenements",
    indexes = [
        Index(name = "idx_mvt_engin_evt_mouvement", columnList = "mouvement_engin_id"),
        Index(name = "idx_mvt_engin_evt_date", columnList = "occurred_at"),
    ]
)
class MouvementEnginEvenement(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mouvement_engin_id", nullable = false)
    var mouvement: MouvementEngin,

    @Enumerated(EnumType.STRING)
    @Column(name = "type_evenement", nullable = false, length = 40)
    var typeEvenement: TypeMouvementEnginEvenement,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_user_id", nullable = false)
    var auteur: User,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: LocalDateTime = LocalDateTime.now(),

    /** JSON sérialisé (compteur, photos, observations). */
    @Column(name = "payload_json", columnDefinition = "TEXT")
    var payloadJson: String? = null,
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is MouvementEnginEvenement) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
}
