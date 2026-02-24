package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.Priorite
import com.mikaservices.platform.common.enums.StatutPointBloquant
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "points_bloquants", indexes = [
    Index(name = "idx_pb_projet", columnList = "projet_id"),
    Index(name = "idx_pb_statut", columnList = "statut"),
    Index(name = "idx_pb_priorite", columnList = "priorite")
])
class PointBloquant(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "priorite", nullable = false, length = 20)
    var priorite: Priorite = Priorite.NORMALE,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutPointBloquant = StatutPointBloquant.OUVERT,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detecte_par_id")
    var detectePar: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigne_a_id")
    var assigneA: User? = null,

    @Column(name = "date_detection")
    var dateDetection: LocalDate = LocalDate.now(),

    @Column(name = "date_resolution")
    var dateResolution: LocalDate? = null,

    @Column(name = "action_corrective", columnDefinition = "TEXT")
    var actionCorrective: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PointBloquant) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: titre.hashCode()

    override fun toString(): String = "PointBloquant(id=$id, titre='$titre', statut=$statut)"
}
