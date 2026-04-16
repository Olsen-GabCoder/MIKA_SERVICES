package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutAffectation
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "affectations_engin_projet", indexes = [
    Index(name = "idx_aff_engin_projet", columnList = "projet_id"),
    Index(name = "idx_aff_engin_engin", columnList = "engin_id")
])
class AffectationEnginChantier(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Column(name = "date_debut", nullable = false)
    var dateDebut: LocalDate,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Column(name = "heures_prevues")
    var heuresPrevues: Int? = null,

    @Column(name = "heures_reelles")
    var heuresReelles: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutAffectation = StatutAffectation.PLANIFIEE,

    @Column(name = "observations", columnDefinition = "TEXT")
    var observations: String? = null,

    /** Renseigné lorsque l'affectation est clôturée dans le cadre d'un ordre de mouvement. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mouvement_engin_id")
    var mouvementEngin: MouvementEngin? = null,
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AffectationEnginChantier) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
    override fun toString(): String = "AffectationEnginChantier(id=$id, statut=$statut)"
}
