package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(name = "ca_previsionnel_realise", indexes = [
    Index(name = "idx_ca_projet", columnList = "projet_id"),
    Index(name = "idx_ca_mois_annee", columnList = "mois, annee")
], uniqueConstraints = [
    UniqueConstraint(name = "uk_ca_projet_mois_annee", columnNames = ["projet_id", "mois", "annee"])
])
class CAPrevisionnelRealise(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "mois", nullable = false)
    var mois: Int,

    @Column(name = "annee", nullable = false)
    var annee: Int,

    @Column(name = "ca_previsionnel", precision = 20, scale = 2)
    var caPrevisionnel: BigDecimal = BigDecimal.ZERO,

    @Column(name = "ca_realise", precision = 20, scale = 2)
    var caRealise: BigDecimal = BigDecimal.ZERO,

    @Column(name = "ecart", precision = 20, scale = 2)
    var ecart: BigDecimal = BigDecimal.ZERO,

    @Column(name = "avancement_cumule", precision = 5, scale = 2)
    var avancementCumule: BigDecimal = BigDecimal.ZERO
) : BaseEntity() {

    fun calculerEcart(): BigDecimal {
        ecart = caRealise.subtract(caPrevisionnel)
        return ecart
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is CAPrevisionnelRealise) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0

    override fun toString(): String = "CAPrevisionnelRealise(id=$id, mois=$mois, annee=$annee)"
}
