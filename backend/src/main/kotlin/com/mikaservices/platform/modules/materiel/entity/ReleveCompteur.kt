package com.mikaservices.platform.modules.materiel.entity

import com.mikaservices.platform.common.entity.BaseEntity
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "releves_compteur", indexes = [
    Index(name = "idx_releve_engin", columnList = "engin_id"),
    Index(name = "idx_releve_date", columnList = "date_releve")
])
class ReleveCompteur(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engin_id", nullable = false)
    var engin: Engin,

    @Column(name = "date_releve", nullable = false)
    var dateReleve: LocalDate,

    @Column(name = "valeur_heures", nullable = false)
    var valeurHeures: Int,

    @Column(name = "releve_par", length = 200)
    var relevePar: String? = null,

    @Column(name = "commentaire", columnDefinition = "TEXT")
    var commentaire: String? = null
) : BaseEntity() {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ReleveCompteur) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: System.identityHashCode(this)
}
