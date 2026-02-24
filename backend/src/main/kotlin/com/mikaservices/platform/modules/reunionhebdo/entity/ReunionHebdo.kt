package com.mikaservices.platform.modules.reunionhebdo.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutReunion
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(name = "reunions_hebdo", indexes = [
    Index(name = "idx_reunion_date", columnList = "date_reunion"),
    Index(name = "idx_reunion_statut", columnList = "statut"),
    Index(name = "idx_reunion_redacteur", columnList = "redacteur_id")
])
class ReunionHebdo(
    @Column(name = "date_reunion", nullable = false)
    var dateReunion: LocalDate,

    @Column(name = "lieu", length = 200)
    var lieu: String? = null,

    @Column(name = "heure_debut")
    var heureDebut: LocalTime? = null,

    @Column(name = "heure_fin")
    var heureFin: LocalTime? = null,

    @Column(name = "ordre_du_jour", columnDefinition = "TEXT")
    var ordreDuJour: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutReunion = StatutReunion.BROUILLON,

    @Column(name = "divers", columnDefinition = "TEXT")
    var divers: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "redacteur_id")
    var redacteur: User? = null,

    @OneToMany(mappedBy = "reunion", fetch = FetchType.LAZY, cascade = [CascadeType.ALL], orphanRemoval = true)
    var participants: MutableList<ParticipantReunion> = mutableListOf(),

    @OneToMany(mappedBy = "reunion", fetch = FetchType.LAZY, cascade = [CascadeType.ALL], orphanRemoval = true)
    var pointsProjet: MutableList<PointProjetPV> = mutableListOf()
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ReunionHebdo) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: dateReunion.hashCode()

    override fun toString(): String = "ReunionHebdo(id=$id, dateReunion=$dateReunion, statut=$statut)"
}
