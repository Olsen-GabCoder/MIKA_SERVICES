package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(name = "dqe_chapitres", indexes = [
    Index(name = "idx_dqe_chapitre_projet", columnList = "projet_id"),
    Index(name = "idx_dqe_chapitre_ordre", columnList = "projet_id, ordre")
])
class DqeChapitre(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "numero", nullable = false, length = 20)
    var numero: String,

    @Column(name = "designation", nullable = false, length = 500)
    var designation: String,

    @Column(name = "ordre", nullable = false)
    var ordre: Int = 0,

    @OneToMany(mappedBy = "chapitre", fetch = FetchType.LAZY, cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("ordre ASC")
    var lignes: MutableList<DqeLigne> = mutableListOf()
) : BaseEntity() {

    /** Montant total du chapitre (somme des lignes) */
    val montantTotal: BigDecimal
        get() = lignes.sumOf { it.montantTotal ?: BigDecimal.ZERO }

    /** Montant exécuté du chapitre (somme des montants exécutés des lignes) */
    val montantExecute: BigDecimal
        get() = lignes.sumOf { it.montantExecute }

    /** Avancement pondéré du chapitre en % (0-100) */
    val avancementPct: BigDecimal
        get() {
            val total = montantTotal
            if (total.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO
            return montantExecute.multiply(BigDecimal(100)).divide(total, 2, java.math.RoundingMode.HALF_UP)
        }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DqeChapitre) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: numero.hashCode()

    override fun toString(): String = "DqeChapitre(id=$id, numero='$numero', designation='$designation')"
}
