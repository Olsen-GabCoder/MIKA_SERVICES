package com.mikaservices.platform.modules.chantier.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "affectations_projet", indexes = [
    Index(name = "idx_aff_projet", columnList = "projet_id"),
    Index(name = "idx_aff_equipe", columnList = "equipe_id")
])
class AffectationChantier(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    var equipe: Equipe,

    @Column(name = "date_debut", nullable = false)
    var dateDebut: LocalDate,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutAffectation = StatutAffectation.PLANIFIEE,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AffectationChantier) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "AffectationChantier(id=$id, statut=$statut)"
}
