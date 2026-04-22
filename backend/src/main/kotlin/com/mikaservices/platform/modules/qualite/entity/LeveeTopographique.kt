package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.YearMonth

@Entity
@Table(
    name = "qualite_levees_topographiques",
    indexes = [
        Index(name = "idx_qlt_projet", columnList = "projet_id"),
        Index(name = "idx_qlt_mois", columnList = "mois_reference"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_qlt_projet_mois", columnNames = ["projet_id", "mois_reference"])
    ]
)
class LeveeTopographique(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "mois_reference", nullable = false, length = 7)
    var moisReference: String = YearMonth.now().toString(),

    @Column(name = "nb_profils_implantes", nullable = false)
    var nbProfilsImplantes: Int = 0,

    @Column(name = "nb_profils_receptionnes", nullable = false)
    var nbProfilsReceptionnes: Int = 0,

    @Column(name = "nb_controles_realises", nullable = false)
    var nbControlesRealises: Int = 0,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saisi_par_id")
    var saisiPar: User? = null,

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is LeveeTopographique) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
