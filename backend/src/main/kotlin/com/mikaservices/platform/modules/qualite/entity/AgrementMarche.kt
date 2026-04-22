package com.mikaservices.platform.modules.qualite.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import com.mikaservices.platform.modules.qualite.enums.StatutAgrement
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDate
import java.time.YearMonth

@Entity
@Table(
    name = "qualite_agrements_marche",
    indexes = [
        Index(name = "idx_qam_projet", columnList = "projet_id"),
        Index(name = "idx_qam_statut", columnList = "statut"),
        Index(name = "idx_qam_mois", columnList = "mois_reference"),
    ]
)
class AgrementMarche(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    var reference: String,

    @Column(name = "objet", nullable = false, length = 300)
    var objet: String,

    @Column(name = "titre", nullable = false, length = 300)
    var titre: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    var statut: StatutAgrement = StatutAgrement.PREVU_AU_MARCHE,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "date_soumission")
    var dateSoumission: LocalDate? = null,

    @Column(name = "date_decision")
    var dateDecision: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decideur_id")
    var decideur: User? = null,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    @Column(name = "mois_reference", nullable = false, length = 7)
    var moisReference: String = YearMonth.now().toString(),

) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AgrementMarche) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reference.hashCode()
}
