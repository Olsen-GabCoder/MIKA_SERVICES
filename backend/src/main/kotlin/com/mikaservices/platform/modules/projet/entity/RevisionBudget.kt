package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "revisions_budget", indexes = [
    Index(name = "idx_revision_projet", columnList = "projet_id")
])
class RevisionBudget(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "ancien_montant", nullable = false, precision = 20, scale = 2)
    var ancienMontant: BigDecimal,

    @Column(name = "nouveau_montant", nullable = false, precision = 20, scale = 2)
    var nouveauMontant: BigDecimal,

    @Column(name = "motif", columnDefinition = "TEXT")
    var motif: String? = null,

    @Column(name = "date_revision", nullable = false)
    var dateRevision: LocalDate = LocalDate.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valide_par_id")
    var validePar: User? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RevisionBudget) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0

    override fun toString(): String = "RevisionBudget(id=$id, ancienMontant=$ancienMontant, nouveauMontant=$nouveauMontant)"
}
