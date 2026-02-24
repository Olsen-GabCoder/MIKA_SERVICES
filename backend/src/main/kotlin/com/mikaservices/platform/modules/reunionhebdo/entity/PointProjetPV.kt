package com.mikaservices.platform.modules.reunionhebdo.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.projet.entity.Projet
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(
    name = "points_projet_pv",
    indexes = [
        Index(name = "idx_pppv_reunion", columnList = "reunion_id"),
        Index(name = "idx_pppv_projet", columnList = "projet_id"),
        Index(name = "idx_pppv_reunion_projet", columnList = "reunion_id, projet_id", unique = true)
    ]
)
class PointProjetPV(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reunion_id", nullable = false)
    var reunion: ReunionHebdo,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "avancement_physique_pct", precision = 5, scale = 2)
    var avancementPhysiquePct: BigDecimal? = null,

    @Column(name = "avancement_financier_pct", precision = 5, scale = 2)
    var avancementFinancierPct: BigDecimal? = null,

    @Column(name = "delai_consomme_pct", precision = 5, scale = 2)
    var delaiConsommePct: BigDecimal? = null,

    @Column(name = "resume_travaux_previsions", columnDefinition = "TEXT")
    var resumeTravauxPrevisions: String? = null,

    @Column(name = "points_bloquants_resume", columnDefinition = "TEXT")
    var pointsBloquantsResume: String? = null,

    @Column(name = "besoins_materiel", columnDefinition = "TEXT")
    var besoinsMateriel: String? = null,

    @Column(name = "besoins_humain", columnDefinition = "TEXT")
    var besoinsHumain: String? = null,

    @Column(name = "propositions_amelioration", columnDefinition = "TEXT")
    var propositionsAmelioration: String? = null,

    @Column(name = "ordre_affichage", nullable = false)
    var ordreAffichage: Int = 0
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PointProjetPV) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: reunion.id.hashCode().plus(projet.id.hashCode())

    override fun toString(): String = "PointProjetPV(id=$id, reunionId=${reunion.id}, projetId=${projet.id})"
}
