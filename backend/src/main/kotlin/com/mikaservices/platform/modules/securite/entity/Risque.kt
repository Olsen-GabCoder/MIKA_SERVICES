package com.mikaservices.platform.modules.securite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.NiveauRisque
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*

@Entity
@Table(name = "risques", indexes = [
    Index(name = "idx_risque_projet", columnList = "projet_id"),
    Index(name = "idx_risque_niveau", columnList = "niveau")
])
class Risque(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau", nullable = false, length = 20)
    var niveau: NiveauRisque,

    @Column(name = "probabilite")
    var probabilite: Int? = null,

    @Column(name = "impact")
    var impact: Int? = null,

    @Column(name = "zone_concernee", length = 200)
    var zoneConcernee: String? = null,

    @Column(name = "mesures_prevention", columnDefinition = "TEXT")
    var mesuresPrevention: String? = null,

    @Column(name = "actif")
    var actif: Boolean = true
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Risque) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: titre.hashCode()
    override fun toString(): String = "Risque(id=$id, titre='$titre', niveau=$niveau)"
}
