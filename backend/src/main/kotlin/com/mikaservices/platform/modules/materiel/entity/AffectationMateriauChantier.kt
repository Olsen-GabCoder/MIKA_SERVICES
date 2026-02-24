package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.Unite
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "affectations_materiau_projet", indexes = [
    Index(name = "idx_aff_mat_projet", columnList = "projet_id"),
    Index(name = "idx_aff_mat_materiau", columnList = "materiau_id")
])
class AffectationMateriauChantier(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materiau_id", nullable = false)
    var materiau: Materiau,

    @Column(name = "quantite_affectee", nullable = false, precision = 15, scale = 2)
    var quantiteAffectee: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(name = "unite", nullable = false, length = 20)
    var unite: Unite,

    @Column(name = "date_affectation", nullable = false)
    var dateAffectation: LocalDate = LocalDate.now(),

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AffectationMateriauChantier) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "AffectationMateriauChantier(id=$id)"
}
