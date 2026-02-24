package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.PhaseEtude
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "avancement_etude_projet",
    indexes = [
        Index(name = "idx_av_etude_projet", columnList = "projet_id"),
        Index(name = "idx_av_etude_projet_phase", columnList = "projet_id, phase", unique = true)
    ]
)
class AvancementEtudeProjet(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Enumerated(EnumType.STRING)
    @Column(name = "phase", nullable = false, length = 30)
    var phase: PhaseEtude,

    @Column(name = "avancement_pct", precision = 5, scale = 2)
    var avancementPct: BigDecimal? = null,

    @Column(name = "date_depot")
    var dateDepot: LocalDate? = null,

    @Column(name = "etat_validation", length = 100)
    var etatValidation: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is AvancementEtudeProjet) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: phase.hashCode()

    override fun toString(): String = "AvancementEtudeProjet(id=$id, projetId=${projet.id}, phase=$phase)"
}
