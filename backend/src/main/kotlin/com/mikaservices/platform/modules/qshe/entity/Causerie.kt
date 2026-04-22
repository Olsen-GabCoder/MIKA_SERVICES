package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(name = "qshe_causeries", indexes = [
    Index(name = "idx_qcau_projet", columnList = "projet_id"),
    Index(name = "idx_qcau_date", columnList = "date_causerie")
])
class Causerie(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @Column(name = "sujet", nullable = false, length = 500)
    var sujet: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "date_causerie", nullable = false)
    var dateCauserie: LocalDate,

    @Column(name = "heure_debut")
    var heureDebut: LocalTime? = null,

    @Column(name = "duree_minutes")
    var dureeMinutes: Int? = null,

    @Column(name = "lieu", length = 200)
    var lieu: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animateur_id")
    var animateur: User? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    /** Participants presents */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "qshe_causerie_participants",
        joinColumns = [JoinColumn(name = "causerie_id")],
        inverseJoinColumns = [JoinColumn(name = "user_id")]
    )
    var participants: MutableSet<User> = mutableSetOf()

) : BaseEntity() {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Causerie) return false
        return id != null && id == other.id
    }
    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
    override fun toString(): String = "Causerie(id=$id, reference='$reference', sujet='$sujet')"
}
