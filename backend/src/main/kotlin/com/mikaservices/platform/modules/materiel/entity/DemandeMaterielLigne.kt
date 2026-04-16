package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(
    name = "demandes_materiel_lignes",
    indexes = [Index(name = "idx_dma_ligne_demande", columnList = "demande_id")]
)
class DemandeMaterielLigne(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    var demande: DemandeMateriel,

    @Column(name = "designation", nullable = false, length = 500)
    var designation: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materiau_id")
    var materiau: Materiau? = null,

    @Column(name = "quantite", nullable = false, precision = 20, scale = 4)
    var quantite: BigDecimal,

    @Column(name = "unite", nullable = false, length = 50)
    var unite: String,

    @Column(name = "prix_unitaire_est", precision = 20, scale = 2)
    var prixUnitaireEst: BigDecimal? = null,

    @Column(name = "fournisseur_suggere", length = 300)
    var fournisseurSuggere: String? = null,
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DemandeMaterielLigne) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
}
