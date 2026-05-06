package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.math.BigDecimal
import java.math.RoundingMode

@Entity
@Table(name = "dqe_lignes", indexes = [
    Index(name = "idx_dqe_ligne_chapitre", columnList = "chapitre_id"),
    Index(name = "idx_dqe_ligne_ordre", columnList = "chapitre_id, ordre")
])
class DqeLigne(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapitre_id", nullable = false)
    var chapitre: DqeChapitre,

    @Column(name = "numero_poste", length = 30)
    var numeroPoste: String? = null,

    @Column(name = "designation", nullable = false, length = 500)
    var designation: String,

    @Column(name = "unite", length = 30)
    var unite: String? = null,

    @Column(name = "quantite", precision = 15, scale = 4)
    var quantite: BigDecimal? = null,

    @Column(name = "prix_unitaire", precision = 20, scale = 2)
    var prixUnitaire: BigDecimal? = null,

    @Column(name = "montant_total", precision = 20, scale = 2)
    var montantTotal: BigDecimal? = null,

    @Column(name = "avancement_pct", precision = 5, scale = 2)
    var avancementPct: BigDecimal = BigDecimal.ZERO,

    @Column(name = "ordre", nullable = false)
    var ordre: Int = 0
) : BaseEntity() {

    /** Montant exécuté = montantTotal * avancementPct / 100 */
    val montantExecute: BigDecimal
        get() {
            val mt = montantTotal ?: return BigDecimal.ZERO
            return mt.multiply(avancementPct).divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
        }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DqeLigne) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: designation.hashCode()

    override fun toString(): String = "DqeLigne(id=$id, numeroPoste='$numeroPoste', designation='$designation')"
}
