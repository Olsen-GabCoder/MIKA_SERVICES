package com.mikaservices.platform.modules.reunionhebdo.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*

@Entity
@Table(name = "participants_reunion", indexes = [
    Index(name = "idx_part_reunion", columnList = "reunion_id"),
    Index(name = "idx_part_user", columnList = "user_id"),
])
class ParticipantReunion(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reunion_id", nullable = false)
    var reunion: ReunionHebdo,

    /** Utilisateur inscrit dans l’application ; null si participant saisi manuellement (hors appli). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    var user: User? = null,

    /** Nom de famille (participant manuel uniquement). */
    @Column(name = "nom_manuel", length = 120)
    var nomManuel: String? = null,

    /** Prénom (participant manuel uniquement). */
    @Column(name = "prenom_manuel", length = 120)
    var prenomManuel: String? = null,

    @Column(name = "initiales", length = 10)
    var initiales: String? = null,

    @Column(name = "telephone", length = 20)
    var telephone: String? = null,

    @Column(name = "present", nullable = false)
    var present: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ParticipantReunion) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)

    override fun toString(): String = "ParticipantReunion(id=$id, reunionId=${reunion.id}, userId=${user?.id})"
}
