package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.YearMonth

@Entity
@Table(
    name = "qualite_essais_labo_beton",
    indexes = [
        Index(name = "idx_qelb_projet", columnList = "projet_id"),
        Index(name = "idx_qelb_mois", columnList = "mois_reference"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_qelb_projet_mois", columnNames = ["projet_id", "mois_reference"])
    ]
)
class EssaiLaboratoireBeton(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "mois_reference", nullable = false, length = 7)
    var moisReference: String = YearMonth.now().toString(),

    @Column(name = "nb_camions_malaxeurs_volume_coulee", nullable = false)
    var nbCamionsMalaxeursVolumeCoulee: Int = 0,

    @Column(name = "nb_essais_slump", nullable = false)
    var nbEssaisSlump: Int = 0,

    @Column(name = "nb_jours_coulage", nullable = false)
    var nbJoursCoulage: Int = 0,

    @Column(name = "nb_prelevements", nullable = false)
    var nbPrelevements: Int = 0,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saisi_par_id")
    var saisiPar: User? = null,

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is EssaiLaboratoireBeton) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}
