package com.mikaservices.platform.modules.projet.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.common.enums.StatutPrevision
import com.mikaservices.platform.common.enums.TypePrevision
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "previsions", indexes = [
    Index(name = "idx_prevision_projet", columnList = "projet_id"),
    Index(name = "idx_prevision_semaine_annee", columnList = "semaine, annee")
])
class Prevision(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    var projet: Projet,

    @Column(name = "semaine")
    var semaine: Int? = null,

    @Column(name = "annee", nullable = false)
    var annee: Int,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TypePrevision,

    @Column(name = "date_debut")
    var dateDebut: LocalDate? = null,

    @Column(name = "date_fin")
    var dateFin: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    var statut: StatutPrevision = StatutPrevision.BROUILLON
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Prevision) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0

    override fun toString(): String = "Prevision(id=$id, type=$type, semaine=$semaine, annee=$annee)"
}
