package com.mikaservices.platform.modules.qshe.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*

@Entity
@Table(name = "qshe_temoins_incident", indexes = [
    Index(name = "idx_qtem_incident", columnList = "incident_id")
])
class TemoinIncident(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    var incident: Incident,

    @Column(name = "nom", nullable = false, length = 100)
    var nom: String,

    @Column(name = "prenom", length = 100)
    var prenom: String? = null,

    @Column(name = "telephone", length = 30)
    var telephone: String? = null,

    @Column(name = "email", length = 200)
    var email: String? = null,

    @Column(name = "entreprise", length = 200)
    var entreprise: String? = null,

    @Column(name = "temoignage", columnDefinition = "TEXT")
    var temoignage: String? = null

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is TemoinIncident) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: nom.hashCode()
    override fun toString(): String = "TemoinIncident(id=$id, nom='$nom')"
}
